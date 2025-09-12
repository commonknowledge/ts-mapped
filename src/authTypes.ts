export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export interface ServerSession {
  jwt: string | null;
  currentUser: CurrentUser | null;
}
