import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { cache } from "react";
import { ServerSession } from "@/authTypes";
import { findUserById } from "@/server/repositories/User";
import logger from "@/server/services/logger";

export const getServerSession = cache(async (): Promise<ServerSession> => {
  const defaultSession = { jwt: null, currentUser: null };
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("JWT");
  if (!authCookie || !authCookie.value) {
    return defaultSession;
  }
  try {
    const jwt = verify(authCookie.value, process.env.JWT_SECRET || "");
    if (jwt && typeof jwt === "object") {
      const user = await findUserById(jwt.id);
      if (!user) {
        return defaultSession;
      }
      return {
        jwt: authCookie.value,
        currentUser: { id: jwt.id, name: user.name, email: user.email },
      };
    }
  } catch (error) {
    logger.warn(`Failed to decode JWT`, { error });
  }
  return defaultSession;
});
