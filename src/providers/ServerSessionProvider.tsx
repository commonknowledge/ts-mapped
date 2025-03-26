"use client";

import { createContext } from "react";
import { ServerSession } from "@/types";

export const ServerSessionContext = createContext<ServerSession>({
  jwt: null,
  currentUser: null
});

export default function ServerSessionProvider({
  serverSession,
  children,
}: {
  serverSession: ServerSession,
  children: React.ReactNode;
}) {
  return <ServerSessionContext value={serverSession}>{children}</ServerSessionContext>;
}
