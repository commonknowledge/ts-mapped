import { cache } from "react";
import { findUserById } from "@/server/repositories/User";
import { decodeJWT } from "./jwt";
import type { ServerSession } from "@/authTypes";

export const getServerSession = cache(async (): Promise<ServerSession> => {
  const defaultSession = { jwt: null, currentUser: null };
  const jwt = await decodeJWT();
  if (jwt && jwt.decoded && typeof jwt.decoded === "object") {
    const user = await findUserById(jwt.decoded.id);
    if (!user) {
      return defaultSession;
    }
    return {
      jwt: jwt.encoded,
      currentUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }
  return defaultSession;
});
