"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useSearchParams } from "next/navigation";
import {
  type MapMode,
  isPrivateRouteAtom,
  mapIdAtom,
  mapModeAtom,
  viewIdAtom,
} from "@/app/map/[id]/atoms/mapStateAtoms";
import type { ReactNode } from "react";

/**
 * Creates a Jotai store boundary and hydrates all "route-level" atoms.
 *
 * `isPrivateRoute` replaces the old `showNavbar` / `editable` / `mapMode`
 * props – the navbar visibility and editor-mode flag are now derived from
 * this single boolean, and `mapMode` is derived from the URL.
 */
export default function MapJotaiProvider({
  mapId,
  viewId,
  isPrivateRoute,
  children,
}: {
  mapId: string;
  viewId?: string;
  isPrivateRoute: boolean;
  children: ReactNode;
}) {
  return (
    <Provider>
      <HydrateAtoms
        mapId={mapId}
        viewId={viewId}
        isPrivateRoute={isPrivateRoute}
      >
        {children}
      </HydrateAtoms>
    </Provider>
  );
}

function HydrateAtoms({
  mapId,
  viewId,
  isPrivateRoute,
  children,
}: {
  mapId: string;
  viewId?: string;
  isPrivateRoute: boolean;
  children: ReactNode;
}) {
  // On the private route, derive mapMode + viewId from the URL so the very
  // first render is correct (no flicker).
  const searchParams = useSearchParams();

  const resolvedMapMode: MapMode = isPrivateRoute
    ? searchParams.get("mode") === "publish"
      ? "public"
      : "private"
    : "public";

  const resolvedViewId = viewId ?? searchParams.get("viewId") ?? undefined;

  useHydrateAtoms([
    [mapIdAtom, mapId],
    [viewIdAtom, resolvedViewId || null],
    [mapModeAtom, resolvedMapMode],
    [isPrivateRouteAtom, isPrivateRoute],
  ]);

  return children;
}
