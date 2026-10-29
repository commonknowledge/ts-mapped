import { SHARE_GRANT_LIFETIME_SECONDS } from "@/constants";
import { addToGrantsCookie, getGrantsCookie } from "./grantsCookie";
import type { ShareGrant } from "@/authTypes";

export const SHARE_GRANTS_COOKIE = "SharedMaps";

/**
 * The visitor's share grants. Callers must validate them against the live
 * mapShare row (see `findValidShareGrantForMap` in server/utils/auth.ts).
 */
export function getShareGrants(): Promise<ShareGrant[]> {
  return getGrantsCookie<ShareGrant>(SHARE_GRANTS_COOKIE);
}

/**
 * Mint a grant for a share and store it in the signed cookie, replacing any
 * previous grant for the same share. Must be called from a route handler or
 * server action.
 */
export function addShareGrant({
  shareId,
  mapId,
}: {
  shareId: string;
  mapId: string;
}): Promise<void> {
  return addToGrantsCookie<ShareGrant>({
    name: SHARE_GRANTS_COOKIE,
    grant: { shareId, mapId, iat: Math.floor(Date.now() / 1000) },
    replaces: (grant) => grant.shareId === shareId,
    lifetimeSeconds: SHARE_GRANT_LIFETIME_SECONDS,
    cookieOptions: { sameSite: "lax" },
  });
}
