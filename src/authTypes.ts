export interface CurrentUser {
  id: string;
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}
