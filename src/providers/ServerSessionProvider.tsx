"use client";

import { createContext, useState } from "react";
import type { CurrentUser, ServerSession } from "@/authTypes";

export const ServerSessionContext = createContext<
  ServerSession & { setCurrentUser: (u: CurrentUser) => void }
>({
  jwt: null,
  currentUser: null,
  setCurrentUser: () => null,
});

export default function ServerSessionProvider({
  serverSession,
  children,
}: {
  serverSession: ServerSession;
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState(serverSession.currentUser);
  return (
    <ServerSessionContext
      value={{ jwt: serverSession.jwt, currentUser, setCurrentUser }}
    >
      {children}
    </ServerSessionContext>
  );
}
