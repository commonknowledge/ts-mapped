import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { ServerSession } from "@/authTypes";
import logger from "@/server/services/logger";

export const getServerSession = async (): Promise<ServerSession> => {
  const defaultSession = { jwt: null, currentUser: null };
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("JWT");
  if (!authCookie || !authCookie.value) {
    return defaultSession;
  }
  try {
    const jwt = verify(authCookie.value, process.env.JWT_SECRET || "");
    if (jwt && typeof jwt === "object") {
      return { jwt: authCookie.value, currentUser: { id: jwt.id } };
    }
  } catch (error) {
    logger.warn(`Failed to decode JWT`, { error });
  }
  return defaultSession;
};
