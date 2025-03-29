"use client";

import { useContext } from "react";
import { ServerSessionContext } from "./providers/ServerSessionProvider";

export const useCurrentUser = () => {
  return useContext(ServerSessionContext).currentUser;
};
