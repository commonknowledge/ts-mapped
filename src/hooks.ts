"use client";

import {
  useCurrentUser as useCurrentUserAtom,
  useSetCurrentUser,
} from "@/atoms/sessionAtoms";

export const useCurrentUser = () => {
  const currentUser = useCurrentUserAtom();
  const setCurrentUser = useSetCurrentUser();
  return { currentUser, setCurrentUser };
};

export const useFeatureFlagEnabled = (
  feature: string,
  user: { featureFlags: string[] } | null,
) => {
  const featureFlagsStr = process.env.NEXT_PUBLIC_FEATURE_FLAGS;
  if (!featureFlagsStr) {
    return process.env.NODE_ENV === "development";
  }
  const featureFlags = JSON.parse(featureFlagsStr || "{}") as Record<
    string,
    boolean
  >;
  return Boolean(featureFlags[feature]) || user?.featureFlags.includes(feature);
};
