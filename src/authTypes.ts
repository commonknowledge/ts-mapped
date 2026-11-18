import type { UserRole } from "@/models/User";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role?: UserRole | null;
  trialEndsAt?: Date | null;
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}

/**
 * Grants an anonymous visitor read access to a shared private map. Minted
 * when the visitor follows a valid magic link. Never sufficient on its own:
 * every check re-validates against the live mapAccess and mapShare rows.
 */
export interface ShareGrant {
  accessId: string;
  mapId: string;
  // Unix seconds when the grant was minted. Grants minted before the
  // access row's decidedAt fail validation.
  iat: number;
}

/**
 * Grants an anonymous visitor read access to a moderated public map. Minted
 * when the visitor follows a valid magic link; carried in a partitioned
 * cookie so it works inside an iframe on the embedding site. Never
 * sufficient on its own: every check re-validates against the live
 * mapAccess row.
 */
export interface PublicMapAccessGrant {
  accessId: string;
  publicMapId: string;
  // Unix seconds when the grant was minted. Grants minted before the
  // access row's decidedAt fail validation.
  iat: number;
}

/** Everything an anonymous visitor's cookies grant them. */
export interface VisitorGrants {
  share: ShareGrant[];
  publicMapAccess: PublicMapAccessGrant[];
}
