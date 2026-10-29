import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/services/mailer", () => ({
  sendEmail: vi.fn(),
}));
// Each email template is rendered just before its sendEmail call, so
// capturing template props in order lines them up with the sendEmail calls
const templateProps = vi.hoisted((): Record<string, string>[] => []);
vi.mock("@/server/emails/PublicMapAccessRequested", () => ({
  default: (props: Record<string, string>) => {
    templateProps.push(props);
    return null;
  },
}));
vi.mock("@/server/emails/PublicMapAccessLink", () => ({
  default: (props: Record<string, string>) => {
    templateProps.push(props);
    return null;
  },
}));

import { MapStyleName } from "@/models/MapView";
import { PublicMapAccessMode } from "@/models/PublicMap";
import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import { CalculationType } from "@/models/shared";
import { createMap, deleteMap } from "@/server/repositories/Map";
import { upsertMapView } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { applyDraft } from "@/server/repositories/PublicMap";
import { findPublicMapAccessById } from "@/server/repositories/PublicMapAccess";
import { db } from "@/server/services/database";
import { sendEmail } from "@/server/services/mailer";
import { findClaimablePublicMapAccess } from "@/server/services/publicMapAccess";
import { publicMapAccessRouter } from "@/server/trpc/routers/publicMapAccess";
import type { PublicMapDraft } from "@/models/PublicMap";

const mockSendEmail = vi.mocked(sendEmail);

const EMBED_URLS = [
  "https://partner.example.org/map",
  "https://second.example.net/map",
];
const MODERATORS = ["mod1@example.org", "mod2@example.org"];

const mapIds: string[] = [];
let moderatedPublicMapId: string;
let openPublicMapId: string;

const caller = publicMapAccessRouter.createCaller({
  user: null,
  ip: "127.0.0.1",
});

function emailsTo(address: string) {
  return mockSendEmail.mock.calls
    .map((call, i) => ({ to: call[0], index: i }))
    .filter(({ to }) => to === address)
    .map(({ index }) => templateProps[index]);
}

const moderationToken = (reviewUrl: string) =>
  reviewUrl.split("/public-map-access/")[1];

const magicToken = (link: string) =>
  new URL(link).searchParams.get("mapped_access") ?? "";

const makeDraft = (accessMode: PublicMapAccessMode): PublicMapDraft => ({
  host: "",
  name: "Flow Test Map",
  description: "",
  descriptionLong: "",
  descriptionLink: "",
  imageUrl: "",
  published: true,
  colorScheme: "red",
  clusteringEnabled: true,
  accessMode,
  moderatorEmails:
    accessMode === PublicMapAccessMode.Moderated ? MODERATORS : [],
  embedUrls: EMBED_URLS,
  dataSourceConfigs: [],
});

async function createPublishedMap(
  orgId: string,
  accessMode: PublicMapAccessMode,
) {
  const map = await createMap(orgId, "Flow Test Map");
  mapIds.push(map.id);
  const viewId = randomUUID();
  await upsertMapView({
    id: viewId,
    mapId: map.id,
    name: "Test View",
    position: 0,
    config: {
      areaDataSourceId: "",
      areaDataColumn: "",
      calculationType: CalculationType.Avg,
      mapStyleName: MapStyleName.Light,
      showLabels: false,
      showLocations: false,
      showMembers: false,
      showTurf: false,
    },
    dataSourceViews: [],
  });
  const publicMap = await applyDraft({
    id: randomUUID(),
    mapId: map.id,
    viewId,
    draft: makeDraft(accessMode),
  });
  return publicMap.id;
}

describe("moderated public map access flow", () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
    templateProps.length = 0;
  });

  afterAll(async () => {
    for (const id of mapIds) {
      await deleteMap(id);
    }
  });

  test("setup", async () => {
    const org = await upsertOrganisation({
      name: `PublicMapAccess Flow Org ${uuidv4()}`,
    });
    moderatedPublicMapId = await createPublishedMap(
      org.id,
      PublicMapAccessMode.Moderated,
    );
    openPublicMapId = await createPublishedMap(
      org.id,
      PublicMapAccessMode.Open,
    );
  });

  let reviewToken: string;
  let accessId: string;

  test("a new request emails every moderator a review link", async () => {
    await caller.request({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
      pageUrl: "https://second.example.net/map?ref=newsletter",
    });

    expect(mockSendEmail).toHaveBeenCalledTimes(MODERATORS.length);
    const [first] = emailsTo(MODERATORS[0]);
    expect(first.email).toBe("visitor@example.org");
    expect(emailsTo(MODERATORS[1])).toHaveLength(1);
    // Nothing goes to the visitor until a moderator approves
    expect(emailsTo("visitor@example.org")).toHaveLength(0);

    reviewToken = moderationToken(first.reviewUrl);
    const review = await caller.review({ token: reviewToken });
    expect(review.status).toBe(PublicMapAccessStatus.Pending);
    expect(review.mapName).toBe("Flow Test Map");
    expect(review.allowedDecisions).toEqual([
      PublicMapAccessStatus.Approved,
      PublicMapAccessStatus.Rejected,
    ]);
  });

  test("a repeat request while pending sends nothing", async () => {
    await caller.request({
      publicMapId: moderatedPublicMapId,
      email: "VISITOR@example.org",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  let firstLinkToken: string;

  test("approving emails the visitor a link to the page they asked from", async () => {
    const result = await caller.decide({
      token: reviewToken,
      status: PublicMapAccessStatus.Approved,
    });
    expect(result.status).toBe(PublicMapAccessStatus.Approved);
    expect(result.allowedDecisions).toEqual([PublicMapAccessStatus.Revoked]);

    const [linkEmail] = emailsTo("visitor@example.org");
    const link = new URL(linkEmail.link);
    // The *configured* URL, without the visitor's ?ref=newsletter
    expect(`${link.origin}${link.pathname}`).toBe(
      "https://second.example.net/map",
    );
    expect(link.searchParams.get("ref")).toBeNull();

    firstLinkToken = magicToken(linkEmail.link);
    const claimable = await findClaimablePublicMapAccess(firstLinkToken);
    expect(claimable?.email).toBe("visitor@example.org");
    accessId = claimable?.id ?? "";
  });

  test("a stale decision is refused", async () => {
    await expect(
      caller.decide({
        token: reviewToken,
        status: PublicMapAccessStatus.Rejected,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("an approved visitor asking again gets a new link without the moderator", async () => {
    await caller.request({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
      pageUrl: "https://partner.example.org/map",
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [linkEmail] = emailsTo("visitor@example.org");
    // Back to the page this request came from
    expect(linkEmail.link.startsWith("https://partner.example.org/map?")).toBe(
      true,
    );

    // The new link replaces the old one
    expect(await findClaimablePublicMapAccess(firstLinkToken)).toBeNull();
    expect(
      await findClaimablePublicMapAccess(magicToken(linkEmail.link)),
    ).not.toBeNull();
  });

  test("a request from an unlisted page keeps the last listed page", async () => {
    await caller.request({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
      pageUrl: "https://not-configured.example.com/map",
    });
    const [linkEmail] = emailsTo("visitor@example.org");
    expect(linkEmail.link.startsWith("https://partner.example.org/map?")).toBe(
      true,
    );
  });

  test("a link stops working after a week", async () => {
    await caller.request({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    const token = magicToken(emailsTo("visitor@example.org")[0].link);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await db
      .updateTable("publicMapAccess")
      .set({ tokenIssuedAt: eightDaysAgo })
      .where("id", "=", accessId)
      .execute();
    expect(await findClaimablePublicMapAccess(token)).toBeNull();
  });

  test("revoking stops links working and stops new links being sent", async () => {
    await caller.request({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    const token = magicToken(emailsTo("visitor@example.org")[0].link);

    await caller.decide({
      token: reviewToken,
      status: PublicMapAccessStatus.Revoked,
    });
    expect(await findClaimablePublicMapAccess(token)).toBeNull();

    mockSendEmail.mockClear();
    await caller.request({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();

    const access = await findPublicMapAccessById(accessId);
    expect(access?.status).toBe(PublicMapAccessStatus.Revoked);
  });

  test("unknown tokens are not claimable", async () => {
    expect(await findClaimablePublicMapAccess("nonsense")).toBeNull();
  });

  test("open maps do not take requests", async () => {
    await expect(
      caller.request({
        publicMapId: openPublicMapId,
        email: "visitor@example.org",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("a tampered moderation token is rejected", async () => {
    await expect(
      caller.review({ token: `${reviewToken}x` }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
