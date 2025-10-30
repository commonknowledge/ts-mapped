"use client";

import { useMemo } from "react";
import {
  PrivateMapStoreContext,
  createPrivateMapStore,
} from "../stores/usePrivateMapStore";
import type { ReactNode } from "react";

export function PrivateMapStoreProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createPrivateMapStore(), []);

  return (
    <PrivateMapStoreContext value={store}>{children}</PrivateMapStoreContext>
  );
}
