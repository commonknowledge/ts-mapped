import { cache } from "react";
import { findUserById } from "@/server/repositories/User";
import logger from "@/server/services/logger";
import { decodeJWT } from "./jwt";
import type { ServerSession } from "@/authTypes";

let featureFlagEmailAllowlists: Record<string, string[]> = {};
try {
  featureFlagEmailAllowlists = JSON.parse(
    process.env.FEATURE_FLAG_EMAIL_ALLOWLISTS || "{}",
  ) as Record<string, string[]>;
} catch (error) {
  logger.error("Failed to parse FEATURE_FLAG_EMAIL_ALLOWLISTS env var", {
    error,
  });
}

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
        featureFlags: Object.keys(featureFlagEmailAllowlists).filter((f) =>
          featureFlagEmailAllowlists[f].includes(user.email),
        ),
        avatarUrl: user.avatarUrl,
      },
    };
  }
  return defaultSession;
});
