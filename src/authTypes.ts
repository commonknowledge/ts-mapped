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
 * Grants an anonymous visitor read access to a shared map. Minted after the
 * visitor proves possession of the share link (and its password, if set);
 * carried in a signed cookie. Never sufficient on its own: every check
 * re-validates against the live mapShare row.
 */
export interface ShareGrant {
  shareId: string;
  mapId: string;
  // Unix seconds when the grant was minted. Grants minted before the
  // share's passwordUpdatedAt fail validation while a password is set.
  iat: number;
}
