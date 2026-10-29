import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { PUBLIC_MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import type { PublicMapAccessGrant } from "@/authTypes";

export const PUBLIC_MAP_ACCESS_COOKIE = "PublicMapAccess";

// Cap the cookie size; adding a grant beyond the cap drops the oldest
const MAX_PUBLIC_MAP_ACCESS_GRANTS = 10;

/**
 * Read and verify the public map access cookie. Returns [] for missing,
 * invalid or expired cookies. Grants returned here are only *candidates*:
 * callers must validate them against the live publicMapAccess row (see
 * `canViewPublicMap` in server/utils/auth.ts).
 */
export async function getPublicMapAccessGrants(): Promise<
  PublicMapAccessGrant[]
> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PUBLIC_MAP_ACCESS_COOKIE);
  if (!cookie?.value) {
    return [];
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify<{ grants: PublicMapAccessGrant[] }>(
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
 * Mint a grant for an approved access row and store it in the signed
 * cookie, replacing any previous grant for the same public map. Must be
 * called from a route handler or server action.
 *
 * The cookie is `SameSite=None; Partitioned` because moderated maps are
 * usually viewed in an iframe on the embedding site: a lax cookie would not
 * be sent there, and partitioning (CHIPS) keeps it working in browsers that
 * block unpartitioned third-party cookies. The grant therefore only applies
 * under the top-level site it was minted on.
 */
export async function addPublicMapAccessGrant({
  accessId,
  publicMapId,
}: {
  accessId: string;
  publicMapId: string;
}): Promise<void> {
  const existing = await getPublicMapAccessGrants();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const grants: PublicMapAccessGrant[] = [
    { accessId, publicMapId, iat: nowSeconds },
    ...existing.filter((grant) => grant.publicMapId !== publicMapId),
  ].slice(0, MAX_PUBLIC_MAP_ACCESS_GRANTS);

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
  const token = await new SignJWT({ grants })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(nowSeconds + PUBLIC_MAP_ACCESS_LIFETIME_SECONDS)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(PUBLIC_MAP_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
    path: "/",
    maxAge: PUBLIC_MAP_ACCESS_LIFETIME_SECONDS,
  });
}
