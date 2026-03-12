export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  featureFlags: string[];
  avatarUrl?: string | null;
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}
