import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@/auth/jwtSecret";
import { MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import { MapAccessStatus } from "@/models/MapAccess";
import MapAccessLink from "@/server/emails/MapAccessLink";
import MapAccessRequested from "@/server/emails/MapAccessRequested";
import { findMapById } from "@/server/repositories/Map";
import {
  addMapAccessToken,
  findMapAccessByTokenHash,
  findOrCreateMapAccess,
  setMapAccessModeratorsNotified,
} from "@/server/repositories/MapAccess";
import { findMapShareById } from "@/server/repositories/MapShare";
import { findPublicMapById } from "@/server/repositories/PublicMap";
import { getAbsoluteUrl } from "@/utils/appUrl";
import {
  buildMapShareAccessLink,
  getMapAccessTargetRef,
} from "@/utils/mapAccess";
import { buildPublicMapAccessLink } from "@/utils/publicMapAccess";
import { sendEmail } from "./mailer";
import type { MapAccess, MapAccessTargetRef } from "@/models/MapAccess";
import type { MapShare } from "@/models/MapShare";
import type { PublicMap } from "@/models/PublicMap";

export type PublicMapForAccess = Pick<
  PublicMap,
  "id" | "name" | "host" | "embedOrigins" | "moderatorEmails"
>;

// A map share with its map's name, which visitors and moderators see
export type MapShareForAccess = Pick<
  MapShare,
  "id" | "token" | "enabled" | "moderatorEmails"
> & { name: string };

/** What an access row is for, loaded: a public map or a map share. */
export type MapAccessTarget =
  | { kind: "publicMap"; publicMap: PublicMapForAccess }
  | { kind: "mapShare"; mapShare: MapShareForAccess };

export const getMapAccessTargetName = (target: MapAccessTarget) =>
  target.kind === "publicMap" ? target.publicMap.name : target.mapShare.name;

const getTargetModeratorEmails = (target: MapAccessTarget) =>
  target.kind === "publicMap"
    ? target.publicMap.moderatorEmails
    : target.mapShare.moderatorEmails;

const toTargetRef = (target: MapAccessTarget): MapAccessTargetRef =>
  target.kind === "publicMap"
    ? { kind: "publicMap", id: target.publicMap.id }
    : { kind: "mapShare", id: target.mapShare.id };

/** Load a map share with its map's name, for the access flow. */
export async function findMapShareForAccess(
  mapShareId: string,
): Promise<MapShareForAccess | null> {
  const mapShare = await findMapShareById(mapShareId);
  if (!mapShare) {
    return null;
  }
  const map = await findMapById(mapShare.mapId);
  if (!map) {
    return null;
  }
  return { ...mapShare, name: map.name };
}

/** Load whatever an access row is for, or null if it no longer exists. */
export async function findMapAccessTarget(
  access: Pick<MapAccess, "publicMapId" | "mapShareId">,
): Promise<MapAccessTarget | null> {
  const ref = getMapAccessTargetRef(access);
  if (ref?.kind === "publicMap") {
    const publicMap = await findPublicMapById(ref.id);
    return publicMap ? { kind: "publicMap", publicMap } : null;
  }
  if (ref?.kind === "mapShare") {
    const mapShare = await findMapShareForAccess(ref.id);
    return mapShare ? { kind: "mapShare", mapShare } : null;
  }
  return null;
}

// Moderation links already emailed are signed with this purpose and never
// expire, so it keeps its original value for maps of both kinds
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
 * `requestedFromUrl` (public maps only) is the page on a listed site the
 * request came from, or null for the map's own address. Its magic link goes
 * back there. Callers must refuse requests from unlisted sites (see
 * getEmbedContext).
 */
export async function requestMapAccess({
  target,
  email,
  requestedFromUrl,
}: {
  target: MapAccessTarget;
  email: string;
  requestedFromUrl: string | null;
}): Promise<void> {
  const { access } = await findOrCreateMapAccess({
    target: toTargetRef(target),
    email,
    requestedFromUrl,
  });

  const awaitingNotification =
    access.status === MapAccessStatus.Pending && !access.moderatorsNotifiedAt;
  if (awaitingNotification) {
    await notifyModerators({ target, access });
    return;
  }

  if (access.status === MapAccessStatus.Approved) {
    await sendMapAccessLink({ target, access });
  }
}

async function notifyModerators({
  target,
  access,
}: {
  target: MapAccessTarget;
  access: MapAccess;
}) {
  const moderatorEmails = getTargetModeratorEmails(target);
  if (!moderatorEmails.length) {
    return;
  }
  const mapName = getMapAccessTargetName(target);
  const token = await signModerationToken(access.id);
  const reviewUrl = getAbsoluteUrl(`map-access/${token}`);
  // One bad address must not stop the others being emailed
  const sent = await Promise.all(
    moderatorEmails.map((moderatorEmail) =>
      sendEmail(
        moderatorEmail,
        `Access request for ${mapName}`,
        MapAccessRequested({
          mapName,
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
  await setMapAccessModeratorsNotified(access.id);
}

/**
 * Issue a new magic link and email it to the visitor. Earlier links keep
 * working, so a request made by someone else in the visitor's name cannot
 * break a link they have yet to click. Only call for approved rows.
 *
 * Returns false, sending nothing, if there is nowhere for the link to point
 * (see buildPublicMapAccessLink). Throws if the email fails.
 */
export async function sendMapAccessLink({
  target,
  access,
}: {
  target: MapAccessTarget;
  access: MapAccess;
}): Promise<boolean> {
  const token = randomBytes(24).toString("base64url");
  const link =
    target.kind === "publicMap"
      ? buildPublicMapAccessLink({
          host: target.publicMap.host,
          embedOrigins: target.publicMap.embedOrigins,
          requestedFromUrl: access.requestedFromUrl,
          token,
        })
      : buildMapShareAccessLink({ shareToken: target.mapShare.token, token });
  if (!link) {
    return false;
  }
  await addMapAccessToken({
    mapAccessId: access.id,
    tokenHash: hashToken(token),
  });
  const mapName = getMapAccessTargetName(target);
  const sent = await sendEmail(
    access.email,
    `Your link to ${mapName}`,
    MapAccessLink({ mapName, link }),
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
export async function findClaimableMapAccess(
  token: string,
): Promise<MapAccess | null> {
  const found = await findMapAccessByTokenHash(hashToken(token));
  if (!found) {
    return null;
  }
  const { tokenIssuedAt, ...access } = found;
  if (access.status !== MapAccessStatus.Approved) {
    return null;
  }
  const expiresAt =
    tokenIssuedAt.getTime() + MAP_ACCESS_LIFETIME_SECONDS * 1000;
  if (expiresAt < Date.now()) {
    return null;
  }
  return access;
}
