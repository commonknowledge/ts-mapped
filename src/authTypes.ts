export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}
