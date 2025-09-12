import { cache } from "react";
import { ServerSession } from "@/authTypes";
import { decodeJWT } from "./jwt";

export const getServerSession = cache(async (): Promise<ServerSession> => {
  const defaultSession = { jwt: null, currentUser: null };
  const jwt = await decodeJWT();
  if (jwt && jwt.decoded && typeof jwt.decoded === "object") {
    return { jwt: jwt.encoded, currentUser: { id: jwt.decoded.id } };
  }
  return defaultSession;
});
