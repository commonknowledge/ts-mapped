import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { PUBLIC_MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import PublicMapAccessLink from "@/server/emails/PublicMapAccessLink";
import PublicMapAccessRequested from "@/server/emails/PublicMapAccessRequested";
import {
  findOrCreatePublicMapAccess,
  findPublicMapAccessByTokenHash,
  setPublicMapAccessTokenHash,
} from "@/server/repositories/PublicMapAccess";
import { getAbsoluteUrl } from "@/utils/appUrl";
import {
  buildPublicMapAccessLink,
  findEmbedUrl,
} from "@/utils/publicMapAccess";
import { sendEmail } from "./mailer";
import type { PublicMap } from "@/models/PublicMap";
import type { PublicMapAccess } from "@/models/PublicMapAccess";

type PublicMapForAccess = Pick<
  PublicMap,
  "id" | "name" | "host" | "embedUrls" | "moderatorEmails"
>;

const MODERATION_TOKEN_PURPOSE = "moderatePublicMapAccess";

// Only the hash is stored, so a database leak does not leak live links.
// The token has 192 bits of entropy, so a fast unsalted hash is enough.
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * The moderator's review link token. It does not expire: it only lets the
 * holder decide this one request, and moderators use the same link to
 * revoke access later.
 */
async function signModerationToken(accessId: string) {
  return new SignJWT({ accessId, purpose: MODERATION_TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .sign(getSecret());
}

/** The access row id a moderation token is for, or null if invalid. */
export async function verifyModerationToken(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify<{ accessId: string; purpose: string }>(
      token,
      getSecret(),
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
 * - already approved: a fresh magic link is emailed straight away
 * - pending, rejected or revoked: nothing is sent
 */
export async function requestPublicMapAccess({
  publicMap,
  email,
  pageUrl,
}: {
  publicMap: PublicMapForAccess;
  email: string;
  pageUrl: string | null;
}): Promise<void> {
  const { access, created } = await findOrCreatePublicMapAccess({
    publicMapId: publicMap.id,
    email,
    // Only remember pages the map is configured to be embedded on
    requestedFromUrl: findEmbedUrl({
      embedUrls: publicMap.embedUrls,
      pageUrl,
    }),
  });

  if (created) {
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
  const token = await signModerationToken(access.id);
  const reviewUrl = getAbsoluteUrl(`public-map-access/${token}`);
  for (const moderatorEmail of publicMap.moderatorEmails) {
    await sendEmail(
      moderatorEmail,
      `Access request for ${publicMap.name}`,
      PublicMapAccessRequested({
        mapName: publicMap.name,
        email: access.email,
        reviewUrl,
      }),
    );
  }
}

/**
 * Issue a new magic link (invalidating the previous one) and email it to
 * the visitor. Only call for approved rows.
 */
export async function sendPublicMapAccessLink({
  publicMap,
  access,
}: {
  publicMap: PublicMapForAccess;
  access: PublicMapAccess;
}) {
  const token = randomBytes(24).toString("base64url");
  await setPublicMapAccessTokenHash({
    id: access.id,
    tokenHash: hashToken(token),
  });
  const link = buildPublicMapAccessLink({
    host: publicMap.host,
    embedUrls: publicMap.embedUrls,
    requestedFromUrl: access.requestedFromUrl,
    token,
  });
  await sendEmail(
    access.email,
    `Your link to ${publicMap.name}`,
    PublicMapAccessLink({ mapName: publicMap.name, link }),
  );
}

/**
 * The approved access row a magic link token is for, or null if the token
 * is unknown, superseded by a newer link, expired, or no longer approved.
 */
export async function findClaimablePublicMapAccess(
  token: string,
): Promise<PublicMapAccess | null> {
  const access = await findPublicMapAccessByTokenHash(hashToken(token));
  if (!access?.tokenIssuedAt) {
    return null;
  }
  if (access.status !== PublicMapAccessStatus.Approved) {
    return null;
  }
  const expiresAt =
    access.tokenIssuedAt.getTime() + PUBLIC_MAP_ACCESS_LIFETIME_SECONDS * 1000;
  if (expiresAt < Date.now()) {
    return null;
  }
  return access;
}
