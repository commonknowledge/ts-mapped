"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useSearchParams } from "next/navigation";
import {
  type MapRoute,
  mapIdAtom,
  mapRouteAtom,
  viewIdAtom,
} from "@/app/(private)/map/[id]/atoms/mapStateAtoms";
import type { ReactNode } from "react";

/**
 * Creates a Jotai store boundary and hydrates all "route-level" atoms.
 *
 * `route` is "public" on the published public map page (`/public/[host]`)
 * and "shared" on the shared map page (`/share/[token]`). Omitted, it is
 * the private map page (`/map/[id]`), which is "editor" or "publish"
 * according to the `mode` URL parameter (see useSyncMapRouteToUrlEffect).
 */
export default function MapJotaiProvider({
  mapId,
  viewId,
  route,
  children,
}: {
  mapId: string;
  viewId?: string;
  route?: Extract<MapRoute, "public" | "shared">;
  children: ReactNode;
}) {
  return (
    <Provider>
      <HydrateAtoms mapId={mapId} viewId={viewId} route={route}>
        {children}
      </HydrateAtoms>
    </Provider>
  );
}

function HydrateAtoms({
  mapId,
  viewId,
  route,
  children,
}: {
  mapId: string;
  viewId?: string;
  route?: MapRoute;
  children: ReactNode;
}) {
  // On the private route, derive the route + viewId from the URL so the
  // very first render is correct (no flicker).
  const searchParams = useSearchParams();

  const resolvedRoute: MapRoute =
    route ?? (searchParams.get("mode") === "publish" ? "publish" : "editor");

  const resolvedViewId = viewId ?? searchParams.get("viewId") ?? undefined;

  useHydrateAtoms([
    [mapIdAtom, mapId],
    [viewIdAtom, resolvedViewId || null],
    [mapRouteAtom, resolvedRoute],
  ]);

  return children;
}
