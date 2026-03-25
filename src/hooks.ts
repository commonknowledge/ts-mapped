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
  organisationFeatures: string[] | undefined,
) => {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return Boolean(organisationFeatures?.includes(feature));
};
