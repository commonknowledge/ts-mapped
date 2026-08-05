import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SHARE_GRANT_LIFETIME_SECONDS } from "@/constants";
import type { ShareGrant } from "@/authTypes";

export const SHARE_GRANTS_COOKIE = "SharedMaps";

// Cap the cookie size; adding a grant beyond the cap drops the oldest
const MAX_SHARE_GRANTS = 10;

/**
 * Read and verify the share-grant cookie. Returns [] for missing, invalid
 * or expired cookies. Grants returned here are only *candidates*: callers
 * must validate them against the live mapShare row (see
 * `findValidShareGrantForMap` in server/utils/auth.ts).
 */
export async function getShareGrants(): Promise<ShareGrant[]> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SHARE_GRANTS_COOKIE);
  if (!cookie?.value) {
    return [];
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify<{ grants: ShareGrant[] }>(
      cookie.value,
      secret,
    );
    return Array.isArray(payload.grants) ? payload.grants : [];
  } catch {
    // Don't bother logging invalid JWTs
    return [];
  }
}

/**
 * Mint a grant for a share and store it in the signed cookie, replacing any
 * previous grant for the same share. Must be called from a route handler or
 * server action: Next.js forbids setting cookies during server component
 * render.
 */
export async function addShareGrant({
  shareId,
  mapId,
}: {
  shareId: string;
  mapId: string;
}): Promise<void> {
  const existing = await getShareGrants();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const grants: ShareGrant[] = [
    { shareId, mapId, iat: nowSeconds },
    ...existing.filter((grant) => grant.shareId !== shareId),
  ].slice(0, MAX_SHARE_GRANTS);

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
  const token = await new SignJWT({ grants })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(nowSeconds + SHARE_GRANT_LIFETIME_SECONDS)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SHARE_GRANTS_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}
