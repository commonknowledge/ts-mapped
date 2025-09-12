"use client";

import { useContext } from "react";
import { ServerSessionContext } from "./providers/ServerSessionProvider";

export const useCurrentUser = () => {
  const { currentUser, setCurrentUser } = useContext(ServerSessionContext);
  return { currentUser, setCurrentUser };
};
