"use client";

import {
  useCurrentUser as useCurrentUserAtom,
  useSetCurrentUser,
} from "@/atoms/sessionAtoms";
import type { Feature } from "./models/Organisation";

export const useCurrentUser = () => {
  const currentUser = useCurrentUserAtom();
  const setCurrentUser = useSetCurrentUser();
  return { currentUser, setCurrentUser };
};

export const useFeatureFlagEnabled = (
  feature: Feature,
  organisationFeatures: Feature[] | undefined,
) => {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return Boolean(organisationFeatures?.includes(feature));
};
