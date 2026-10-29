import { PUBLIC_MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import { addToGrantsCookie, getGrantsCookie } from "./grantsCookie";
import type { PublicMapAccessGrant } from "@/authTypes";

export const PUBLIC_MAP_ACCESS_COOKIE = "PublicMapAccess";

/**
 * The visitor's public map access grants. Callers must validate them
 * against the live publicMapAccess row (see `canViewPublicMap` in
 * server/utils/auth.ts).
 */
export function getPublicMapAccessGrants(): Promise<PublicMapAccessGrant[]> {
  return getGrantsCookie<PublicMapAccessGrant>(PUBLIC_MAP_ACCESS_COOKIE);
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
export function addPublicMapAccessGrant({
  accessId,
  publicMapId,
}: {
  accessId: string;
  publicMapId: string;
}): Promise<void> {
  return addToGrantsCookie<PublicMapAccessGrant>({
    name: PUBLIC_MAP_ACCESS_COOKIE,
    grant: { accessId, publicMapId, iat: Math.floor(Date.now() / 1000) },
    replaces: (grant) => grant.publicMapId === publicMapId,
    lifetimeSeconds: PUBLIC_MAP_ACCESS_LIFETIME_SECONDS,
    cookieOptions: {
      sameSite: "none",
      partitioned: true,
      maxAge: PUBLIC_MAP_ACCESS_LIFETIME_SECONDS,
    },
  });
}
