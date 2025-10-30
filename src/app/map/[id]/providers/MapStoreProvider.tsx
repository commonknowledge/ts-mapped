"use client";

import { useMemo } from "react";
import {
  MapStoreContext,
  createMapStore
} from "../stores/useMapStore";
import type { ReactNode } from "react";

export function MapStoreProvider({
  children,
  viewId: initialViewId,
}: {
  children: ReactNode;
  viewId?: string;
}) {
  const store = useMemo(
    () => createMapStore({ initialViewId }),
    [initialViewId],
  );

  return <MapStoreContext value={store}>{children}</MapStoreContext>;
}
