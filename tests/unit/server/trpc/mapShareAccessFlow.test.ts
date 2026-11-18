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
import { createMap, deleteMap } from "@/server/repositories/Map";
import {
  setMapShareEnabled,
  setMapShareModeratorEmails,
} from "@/server/repositories/MapShare";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { sendEmail } from "@/server/services/mailer";
import { findClaimableMapAccess } from "@/server/services/mapAccess";
import { mapAccessRouter } from "@/server/trpc/routers/mapAccess";
import type { MapShare } from "@/models/MapShare";

const mockSendEmail = vi.mocked(sendEmail);

const MODERATORS = ["share-mod1@example.org", "share-mod2@example.org"];
const VISITOR = "share-visitor@example.org";

let mapId: string;
let share: MapShare;

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

describe("shared map access flow", () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
    templateProps.length = 0;
  });

  afterAll(async () => {
    if (mapId) {
      await deleteMap(mapId);
    }
  });

  test("setup", async () => {
    const org = await upsertOrganisation({
      name: `MapShare Flow Org ${uuidv4()}`,
    });
    const map = await createMap(org.id, "Share Flow Map");
    mapId = map.id;
    await setMapShareModeratorEmails({ mapId, moderatorEmails: MODERATORS });
    const enabled = await setMapShareEnabled({ mapId, enabled: true });
    if (!enabled) {
      throw new Error("Share was not created");
    }
    share = enabled;
  });

  test("an unknown share link refuses requests", async () => {
    await expect(
      caller.requestMapShare({ shareToken: "nonsense", email: VISITOR }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("a disabled share refuses requests", async () => {
    await setMapShareEnabled({ mapId, enabled: false });
    await expect(
      caller.requestMapShare({ shareToken: share.token, email: VISITOR }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mockSendEmail).not.toHaveBeenCalled();
    await setMapShareEnabled({ mapId, enabled: true });
  });

  let reviewToken: string;

  test("a new request emails every moderator a review link", async () => {
    await caller.requestMapShare({ shareToken: share.token, email: VISITOR });

    for (const moderator of MODERATORS) {
      const [email] = emailsTo(moderator);
      expect(email.mapName).toBe("Share Flow Map");
      expect(email.email).toBe(VISITOR);
    }
    reviewToken = moderationToken(emailsTo(MODERATORS[0])[0].reviewUrl);

    const review = await caller.review({ token: reviewToken });
    expect(review.mapName).toBe("Share Flow Map");
    expect(review.status).toBe(MapAccessStatus.Pending);
  });

  test("a repeat request while pending sends nothing", async () => {
    await caller.requestMapShare({ shareToken: share.token, email: VISITOR });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  let firstLinkToken: string;

  test("approving emails the visitor a link to the shared map", async () => {
    const result = await caller.decide({
      token: reviewToken,
      status: MapAccessStatus.Approved,
    });
    expect(result.status).toBe(MapAccessStatus.Approved);

    const [linkEmail] = emailsTo(VISITOR);
    expect(linkEmail.mapName).toBe("Share Flow Map");
    const link = new URL(linkEmail.link);
    expect(link.pathname).toBe(`/share/${share.token}`);

    firstLinkToken = magicToken(linkEmail.link);
    const claimable = await findClaimableMapAccess(firstLinkToken);
    expect(claimable?.mapShareId).toBe(share.id);
    expect(claimable?.publicMapId).toBeNull();
  });

  test("an approved visitor asking again gets a fresh link without a moderator", async () => {
    await caller.requestMapShare({ shareToken: share.token, email: VISITOR });

    expect(emailsTo(MODERATORS[0])).toEqual([]);
    const [linkEmail] = emailsTo(VISITOR);
    const token = magicToken(linkEmail.link);
    expect(token).not.toBe(firstLinkToken);
    expect(await findClaimableMapAccess(token)).not.toBeNull();
    expect(await findClaimableMapAccess(firstLinkToken)).not.toBeNull();
  });

  test("revoking access stops every link working", async () => {
    await caller.decide({
      token: reviewToken,
      status: MapAccessStatus.Revoked,
    });
    expect(await findClaimableMapAccess(firstLinkToken)).toBeNull();
  });
});
