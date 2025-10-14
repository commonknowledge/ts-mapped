"use client";

import { useContext } from "react";
import { ServerSessionContext } from "./providers/ServerSessionProvider";

export const useCurrentUser = () => {
  const { currentUser, setCurrentUser } = useContext(ServerSessionContext);
  return { currentUser, setCurrentUser };
};

export const useFeatureFlagEnabled = (feature: string) => {
  const featureFlagsStr = process.env.NEXT_PUBLIC_FEATURE_FLAGS;
  if (!featureFlagsStr) {
    return process.env.NODE_ENV === "development";
  }
  const featureFlags = JSON.parse(featureFlagsStr || "{}") as Record<
    string,
    boolean
  >;
  return Boolean(featureFlags[feature]);
};
