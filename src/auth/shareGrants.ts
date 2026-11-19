import { MAP_ACCESS_LIFETIME_SECONDS } from "@/constants";
import { addToGrantsCookie, getGrantsCookie } from "./grantsCookie";
import type { ShareGrant } from "@/authTypes";

export const SHARE_GRANTS_COOKIE = "SharedMaps";

/**
 * The visitor's share grants. Callers must validate them against the live
 * rows (see `findValidShareGrantForMap` in server/utils/auth.ts).
 */
export function getShareGrants(): Promise<ShareGrant[]> {
  return getGrantsCookie<ShareGrant>(SHARE_GRANTS_COOKIE);
}

/**
 * Mint a grant for an approved access row and store it in the signed
 * cookie, replacing any previous grant for the same map. Must be called
 * from a route handler or server action.
 *
 * Unlike public map access grants, this cookie is first-party (SameSite
 * Lax): shared maps are opened at their Mapped address, never embedded.
 */
export function addShareGrant({
  accessId,
  mapId,
}: {
  accessId: string;
  mapId: string;
}): Promise<void> {
  return addToGrantsCookie<ShareGrant>({
    name: SHARE_GRANTS_COOKIE,
    grant: { accessId, mapId, iat: Math.floor(Date.now() / 1000) },
    replaces: (grant) => grant.mapId === mapId,
    lifetimeSeconds: MAP_ACCESS_LIFETIME_SECONDS,
    cookieOptions: { sameSite: "lax" },
  });
}
