import { cache } from "react";
import { decodeJWT } from "./jwt";
import type { ServerSession } from "@/authTypes";

export const getServerSession = cache(async (): Promise<ServerSession> => {
  const defaultSession = { jwt: null, currentUser: null };
  const jwt = await decodeJWT();
  if (jwt && jwt.decoded && typeof jwt.decoded === "object") {
    return { jwt: jwt.encoded, currentUser: { id: jwt.decoded.id } };
  }
  return defaultSession;
});
