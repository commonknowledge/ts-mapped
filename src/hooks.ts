"use client";

import { useContext } from "react";
import { ServerSessionContext } from "./providers/ServerSessionProvider";

export const useCurrentUser = () => {
  const { currentUser, setCurrentUser } = useContext(ServerSessionContext);
  return { currentUser, setCurrentUser };
};

export const useFeatureFlagEnabled = (
  feature: string,
  user: { email: string } | null,
) => {
  const featureFlagsStr = process.env.NEXT_PUBLIC_FEATURE_FLAGS;
  if (!featureFlagsStr) {
    return process.env.NODE_ENV === "development";
  }
  const featureFlags = JSON.parse(featureFlagsStr || "{}") as Record<
    string,
    string[] | boolean
  >;
  const featureFlag = featureFlags[feature];
  if (Array.isArray(featureFlag)) {
    if (!user) {
      return false;
    }
    const normalizedFeatureFlag = featureFlag.map((email) =>
      email.trim().toLowerCase(),
    );
    const normalizedUserEmail = user.email.trim().toLowerCase();
    return normalizedFeatureFlag.includes(normalizedUserEmail);
  }
  return Boolean(featureFlag);
};
