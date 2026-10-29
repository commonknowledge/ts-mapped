import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@/auth/jwtSecret";
import { PUBLIC_MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import PublicMapAccessLink from "@/server/emails/PublicMapAccessLink";
import PublicMapAccessRequested from "@/server/emails/PublicMapAccessRequested";
import {
  addPublicMapAccessToken,
  findOrCreatePublicMapAccess,
  findPublicMapAccessByTokenHash,
  setPublicMapAccessModeratorsNotified,
} from "@/server/repositories/PublicMapAccess";
import { getAbsoluteUrl } from "@/utils/appUrl";
import { buildPublicMapAccessLink } from "@/utils/publicMapAccess";
import { sendEmail } from "./mailer";
import type { PublicMap } from "@/models/PublicMap";
import type { PublicMapAccess } from "@/models/PublicMapAccess";

export type PublicMapForAccess = Pick<
  PublicMap,
  "id" | "name" | "host" | "embedOrigins" | "moderatorEmails"
>;

const MODERATION_TOKEN_PURPOSE = "moderatePublicMapAccess";

// Only the hash is stored, so a database leak does not leak live links.
// The token has 192 bits of entropy, so a fast unsalted hash is enough.
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/**
 * The moderator's review link token. It does not expire: it only lets the
 * holder decide this one request, and moderators use the same link to
 * revoke access later.
 */
async function signModerationToken(accessId: string) {
  return new SignJWT({ accessId, purpose: MODERATION_TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .sign(getJwtSecret());
}

/** The access row id a moderation token is for, or null if invalid. */
export async function verifyModerationToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify<{ accessId: string; purpose: string }>(
      token,
      getJwtSecret(),
    );
    return payload.purpose === MODERATION_TOKEN_PURPOSE
      ? payload.accessId
      : null;
  } catch {
    return null;
  }
}

/**
 * Handle an access request from the gate. The outcome is never reported
 * back, so the form cannot be used to find out who has access:
 * - new email: stored as pending, and every moderator is emailed
 * - pending, but no moderator has been emailed yet (e.g. the email failed,
 *   or the map had no moderators): every moderator is emailed
 * - already approved: a fresh magic link is emailed straight away
 * - otherwise: nothing is sent
 *
 * `requestedFromUrl` is the page on a listed site the request came from, or
 * null for the map's own address. Its magic link goes back there. Callers
 * must refuse requests from unlisted sites (see getEmbedContext).
 */
export async function requestPublicMapAccess({
  publicMap,
  email,
  requestedFromUrl,
}: {
  publicMap: PublicMapForAccess;
  email: string;
  requestedFromUrl: string | null;
}): Promise<void> {
  const { access } = await findOrCreatePublicMapAccess({
    publicMapId: publicMap.id,
    email,
    requestedFromUrl,
  });

  const awaitingNotification =
    access.status === PublicMapAccessStatus.Pending &&
    !access.moderatorsNotifiedAt;
  if (awaitingNotification) {
    await notifyModerators({ publicMap, access });
    return;
  }

  if (access.status === PublicMapAccessStatus.Approved) {
    await sendPublicMapAccessLink({ publicMap, access });
  }
}

async function notifyModerators({
  publicMap,
  access,
}: {
  publicMap: PublicMapForAccess;
  access: PublicMapAccess;
}) {
  if (!publicMap.moderatorEmails.length) {
    return;
  }
  const token = await signModerationToken(access.id);
  const reviewUrl = getAbsoluteUrl(`public-map-access/${token}`);
  // One bad address must not stop the others being emailed
  const sent = await Promise.all(
    publicMap.moderatorEmails.map((moderatorEmail) =>
      sendEmail(
        moderatorEmail,
        `Access request for ${publicMap.name}`,
        PublicMapAccessRequested({
          mapName: publicMap.name,
          email: access.email,
          reviewUrl,
        }),
      ),
    ),
  );
  if (!sent.includes(true)) {
    // Left unmarked, so the visitor asking again retries the notification
    throw new Error(`Couldn't email any moderator about request ${access.id}`);
  }
  await setPublicMapAccessModeratorsNotified(access.id);
}

/**
 * Issue a new magic link and email it to the visitor. Earlier links keep
 * working, so a request made by someone else in the visitor's name cannot
 * break a link they have yet to click. Only call for approved rows.
 *
 * Returns false, sending nothing, if there is nowhere for the link to point
 * (see buildPublicMapAccessLink). Throws if the email fails.
 */
export async function sendPublicMapAccessLink({
  publicMap,
  access,
}: {
  publicMap: PublicMapForAccess;
  access: PublicMapAccess;
}): Promise<boolean> {
  const token = randomBytes(24).toString("base64url");
  const link = buildPublicMapAccessLink({
    host: publicMap.host,
    embedOrigins: publicMap.embedOrigins,
    requestedFromUrl: access.requestedFromUrl,
    token,
  });
  if (!link) {
    return false;
  }
  await addPublicMapAccessToken({
    publicMapAccessId: access.id,
    tokenHash: hashToken(token),
  });
  const sent = await sendEmail(
    access.email,
    `Your link to ${publicMap.name}`,
    PublicMapAccessLink({ mapName: publicMap.name, link }),
  );
  if (!sent) {
    throw new Error(`Couldn't email the link for request ${access.id}`);
  }
  return true;
}

/**
 * The approved access row a magic link token is for, or null if the token
 * is unknown, expired, or no longer approved.
 */
export async function findClaimablePublicMapAccess(
  token: string,
): Promise<PublicMapAccess | null> {
  const found = await findPublicMapAccessByTokenHash(hashToken(token));
  if (!found) {
    return null;
  }
  const { tokenIssuedAt, ...access } = found;
  if (access.status !== PublicMapAccessStatus.Approved) {
    return null;
  }
  const expiresAt =
    tokenIssuedAt.getTime() + PUBLIC_MAP_ACCESS_LIFETIME_SECONDS * 1000;
  if (expiresAt < Date.now()) {
    return null;
  }
  return access;
}
