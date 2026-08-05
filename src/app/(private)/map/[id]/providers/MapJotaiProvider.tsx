"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useSearchParams } from "next/navigation";
import {
  type MapMode,
  isPublicMapRouteAtom,
  isReadOnlyRouteAtom,
  mapIdAtom,
  mapModeAtom,
  viewIdAtom,
} from "@/app/(private)/map/[id]/atoms/mapStateAtoms";
import type { ReactNode } from "react";

/**
 * Creates a Jotai store boundary and hydrates all "route-level" atoms.
 *
 * `isPublicMapRoute` is `true` only on the standalone public page (`/public/[host]`).
 * The navbar visibility and editor-mode flag are derived from this single boolean,
 * and `mapMode` is derived from the URL.
 *
 * `isReadOnlyRoute` is `true` only on the shared map page (`/share/[token]`),
 * where anonymous viewers see the private map without editing affordances.
 */
export default function MapJotaiProvider({
  mapId,
  viewId,
  isPublicMapRoute = false,
  isReadOnlyRoute = false,
  children,
}: {
  mapId: string;
  viewId?: string;
  isPublicMapRoute?: boolean;
  isReadOnlyRoute?: boolean;
  children: ReactNode;
}) {
  return (
    <Provider>
      <HydrateAtoms
        mapId={mapId}
        viewId={viewId}
        isPublicMapRoute={isPublicMapRoute}
        isReadOnlyRoute={isReadOnlyRoute}
      >
        {children}
      </HydrateAtoms>
    </Provider>
  );
}

function HydrateAtoms({
  mapId,
  viewId,
  isPublicMapRoute,
  isReadOnlyRoute,
  children,
}: {
  mapId: string;
  viewId?: string;
  isPublicMapRoute: boolean;
  isReadOnlyRoute: boolean;
  children: ReactNode;
}) {
  // On the private route, derive mapMode + viewId from the URL so the very
  // first render is correct (no flicker).
  const searchParams = useSearchParams();

  const resolvedMapMode: MapMode = isPublicMapRoute
    ? "public"
    : searchParams.get("mode") === "publish"
      ? "public"
      : "private";

  const resolvedViewId = viewId ?? searchParams.get("viewId") ?? undefined;

  useHydrateAtoms([
    [mapIdAtom, mapId],
    [viewIdAtom, resolvedViewId || null],
    [mapModeAtom, resolvedMapMode],
    [isPublicMapRouteAtom, isPublicMapRoute],
    [isReadOnlyRouteAtom, isReadOnlyRoute],
  ]);

  return children;
}
