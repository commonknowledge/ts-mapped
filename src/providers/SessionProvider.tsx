"use client";

import { getDefaultStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { currentUserAtom } from "@/atoms/sessionAtoms";
import type { ServerSession } from "@/authTypes";
import type { ReactNode } from "react";

export default function SessionHydrator({
  serverSession,
  children,
}: {
  serverSession: ServerSession;
  children: ReactNode;
}) {
  useHydrateAtoms([[currentUserAtom, serverSession.currentUser]], {
    store: getDefaultStore(),
  });
  return <>{children}</>;
}
