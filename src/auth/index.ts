import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import logger from "@/server/services/logger";
import { getErrorMessage } from "@/server/util";
import { ServerSession } from "@/types";

export const getServerSession = async (): Promise<ServerSession> => {
  const defaultSession = { jwt: null, currentUser: null };
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("JWT");
  if (!authCookie || !authCookie.value) {
    return defaultSession
  }
  try {
    const jwt = verify(authCookie.value, process.env.JWT_SECRET || "");
    if (jwt && typeof jwt === "object") {
      return { jwt: authCookie.value, currentUser: { id: jwt.id } }
    }
  } catch (e) {
    const error = getErrorMessage(e);
    logger.warn(`Failed to decode JWT: ${error}`);
  }
  return defaultSession
};
