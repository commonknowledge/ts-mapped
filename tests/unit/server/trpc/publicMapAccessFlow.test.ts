import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/services/mailer", () => ({
  sendEmail: vi.fn(async () => true),
}));
// Each email template is rendered just before its sendEmail call, so
// capturing template props in order lines them up with the sendEmail calls
const templateProps = vi.hoisted((): Record<string, string>[] => []);
vi.mock("@/server/emails/MapAccessRequested", () => ({
  default: (props: Record<string, string>) => {
    templateProps.push(props);
    return null;
  },
}));
vi.mock("@/server/emails/MapAccessLink", () => ({
  default: (props: Record<string, string>) => {
    templateProps.push(props);
    return null;
  },
}));

import { MapAccessStatus } from "@/models/MapAccess";
import { MapStyleName } from "@/models/MapView";
import { PublicMapAccessMode } from "@/models/PublicMap";
import { CalculationType } from "@/models/shared";
import { createMap, deleteMap } from "@/server/repositories/Map";
import {
  findMapAccessById,
  setMapAccessStatus,
} from "@/server/repositories/MapAccess";
import { upsertMapView } from "@/server/repositories/MapView";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { applyDraft } from "@/server/repositories/PublicMap";
import { db } from "@/server/services/database";
import { sendEmail } from "@/server/services/mailer";
import { findClaimableMapAccess } from "@/server/services/mapAccess";
import { mapAccessRouter } from "@/server/trpc/routers/mapAccess";
import type { PublicMapDraft } from "@/models/PublicMap";

const mockSendEmail = vi.mocked(sendEmail);

const EMBED_ORIGINS = [
  "https://partner.example.org",
  "https://second.example.net",
];
const MODERATORS = ["mod1@example.org", "mod2@example.org"];

const mapIds: string[] = [];
let moderatedPublicMapId: string;
let openPublicMapId: string;

const caller = mapAccessRouter.createCaller({
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
  reviewUrl.split("/map-access/")[1];

const magicToken = (link: string) =>
  new URL(link).searchParams.get("mapped_access") ?? "";

// Unique, so the test doesn't collide with real maps' subdomains
const moderatedHost = `flow-${uuidv4()}.localhost:3001`;

const makeDraft = (accessMode: PublicMapAccessMode): PublicMapDraft => ({
  host: accessMode === PublicMapAccessMode.Moderated ? moderatedHost : "",
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
  embedOrigins: EMBED_ORIGINS,
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
      name: `MapAccess Flow Org ${uuidv4()}`,
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
    await caller.requestPublicMap({
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
    expect(review.status).toBe(MapAccessStatus.Pending);
    expect(review.mapName).toBe("Flow Test Map");
    expect(review.allowedDecisions).toEqual([
      MapAccessStatus.Approved,
      MapAccessStatus.Rejected,
    ]);
  });

  test("a repeat request while pending sends nothing", async () => {
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "VISITOR@example.org",
      pageUrl: "https://second.example.net/resources/map?ref=newsletter#top",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("if no moderator could be emailed, asking again retries", async () => {
    mockSendEmail.mockResolvedValue(false);
    await expect(
      caller.requestPublicMap({
        publicMapId: moderatedPublicMapId,
        email: "retry@example.org",
      }),
    ).rejects.toThrow();
    mockSendEmail.mockResolvedValue(true);
    mockSendEmail.mockClear();
    templateProps.length = 0;

    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "retry@example.org",
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(MODERATORS.length);

    // Once a moderator has the request, asking again sends nothing
    mockSendEmail.mockClear();
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "retry@example.org",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("one moderator's email failing still counts as notified", async () => {
    mockSendEmail.mockResolvedValueOnce(false);
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "partial@example.org",
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(MODERATORS.length);

    mockSendEmail.mockClear();
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "partial@example.org",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("a request from an embed on an unlisted website is refused", async () => {
    await expect(
      caller.requestPublicMap({
        publicMapId: moderatedPublicMapId,
        email: "someone-else@example.org",
        pageUrl: "https://not-listed.example.com/map",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  let firstLinkToken: string;

  test("approving emails the visitor a link to the page they last asked from", async () => {
    const result = await caller.decide({
      token: reviewToken,
      status: MapAccessStatus.Approved,
    });
    expect(result.status).toBe(MapAccessStatus.Approved);
    expect(result.allowedDecisions).toEqual([MapAccessStatus.Revoked]);

    const [linkEmail] = emailsTo("visitor@example.org");
    // Any page on a listed website, kept exactly (minus the fragment)
    expect(linkEmail.link).toMatch(
      /^https:\/\/second\.example\.net\/resources\/map\?ref=newsletter&mapped_access=/,
    );

    firstLinkToken = magicToken(linkEmail.link);
    const claimable = await findClaimableMapAccess(firstLinkToken);
    expect(claimable?.email).toBe("visitor@example.org");
    accessId = claimable?.id ?? "";
  });

  test("a stale decision is refused", async () => {
    await expect(
      caller.decide({
        token: reviewToken,
        status: MapAccessStatus.Rejected,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  test("a decision only applies if nobody else decided first", async () => {
    const updated = await setMapAccessStatus({
      id: accessId,
      fromStatus: MapAccessStatus.Pending,
      status: MapAccessStatus.Rejected,
    });
    expect(updated).toBeUndefined();
    const access = await findMapAccessById(accessId);
    expect(access?.status).toBe(MapAccessStatus.Approved);
  });

  test("if the link email fails, the approval is undone so it can be retried", async () => {
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "unlucky@example.org",
    });
    const token = moderationToken(emailsTo(MODERATORS[0])[0].reviewUrl);

    mockSendEmail.mockResolvedValueOnce(false);
    await expect(
      caller.decide({ token, status: MapAccessStatus.Approved }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    const review = await caller.review({ token });
    expect(review.status).toBe(MapAccessStatus.Pending);

    const result = await caller.decide({
      token,
      status: MapAccessStatus.Approved,
    });
    expect(result.status).toBe(MapAccessStatus.Approved);
    const links = emailsTo("unlucky@example.org");
    expect(links).toHaveLength(2);
    // Only the link that was actually emailed works
    expect(await findClaimableMapAccess(magicToken(links[0].link))).toBeNull();
    expect(
      await findClaimableMapAccess(magicToken(links[1].link)),
    ).not.toBeNull();
  });

  test("an approved visitor asking again gets a new link without the moderator", async () => {
    await caller.requestPublicMap({
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

    // Both links work, so a request made in the visitor's name can't break
    // a link they have yet to click
    expect(await findClaimableMapAccess(firstLinkToken)).not.toBeNull();
    expect(
      await findClaimableMapAccess(magicToken(linkEmail.link)),
    ).not.toBeNull();
  });

  test("a request from the map's own address gets a link to its own address", async () => {
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    const [linkEmail] = emailsTo("visitor@example.org");
    expect(new URL(linkEmail.link).host).toBe(moderatedHost);
  });

  test("a link stops working after a week", async () => {
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    const token = magicToken(emailsTo("visitor@example.org")[0].link);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await db
      .updateTable("mapAccessToken")
      .set({ issuedAt: eightDaysAgo })
      .where("mapAccessId", "=", accessId)
      .execute();
    expect(await findClaimableMapAccess(token)).toBeNull();
    expect(await findClaimableMapAccess(firstLinkToken)).toBeNull();

    // Expired links are cleared out when the next one is issued
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    const remaining = await db
      .selectFrom("mapAccessToken")
      .where("mapAccessId", "=", accessId)
      .selectAll()
      .execute();
    expect(remaining).toHaveLength(1);
  });

  test("revoking stops links working and stops new links being sent", async () => {
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    const token = magicToken(emailsTo("visitor@example.org")[0].link);

    await caller.decide({
      token: reviewToken,
      status: MapAccessStatus.Revoked,
    });
    expect(await findClaimableMapAccess(token)).toBeNull();

    mockSendEmail.mockClear();
    await caller.requestPublicMap({
      publicMapId: moderatedPublicMapId,
      email: "visitor@example.org",
    });
    expect(mockSendEmail).not.toHaveBeenCalled();

    const access = await findMapAccessById(accessId);
    expect(access?.status).toBe(MapAccessStatus.Revoked);
  });

  test("approving again after a revoke does not bring old links back", async () => {
    await caller.decide({
      token: reviewToken,
      status: MapAccessStatus.Approved,
    });
    expect(await findClaimableMapAccess(firstLinkToken)).toBeNull();
    const [linkEmail] = emailsTo("visitor@example.org");
    expect(
      await findClaimableMapAccess(magicToken(linkEmail.link)),
    ).not.toBeNull();
  });

  test("unknown tokens are not claimable", async () => {
    expect(await findClaimableMapAccess("nonsense")).toBeNull();
  });

  test("open maps do not take requests", async () => {
    await expect(
      caller.requestPublicMap({
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
