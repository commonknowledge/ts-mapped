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
