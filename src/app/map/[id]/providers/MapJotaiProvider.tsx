"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { mapIdAtom, viewIdAtom } from "@/app/map/[id]/atoms/mapStateAtoms";
import type { ReactNode } from "react";

/**
 * Creates a Jotai store boundary.
 * Accepts initial values for mapId and viewId from server components.
 */
export default function MapJotaiProvider({
  mapId,
  viewId,
  children,
}: {
  mapId: string;
  viewId?: string;
  children: ReactNode;
}) {
  return (
    <Provider>
      <HydrateAtoms mapId={mapId} viewId={viewId}>
        {children}
      </HydrateAtoms>
    </Provider>
  );
}

function HydrateAtoms({
  mapId,
  viewId,
  children,
}: {
  mapId: string;
  viewId?: string;
  children: ReactNode;
}) {
  useHydrateAtoms(
    new Map([
      [mapIdAtom, mapId],
      [viewIdAtom, viewId],
    ]),
  );
  return children;
}
