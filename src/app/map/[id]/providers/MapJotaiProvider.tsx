"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useSearchParams } from "next/navigation";
import {
  type MapMode,
  mapIdAtom,
  mapModeAtom,
  showNavbarAtom,
  viewIdAtom,
} from "@/app/map/[id]/atoms/mapStateAtoms";
import {
  activeTabIdAtom,
  publicMapAtom,
} from "@/app/map/[id]/publish/atoms/publicMapAtoms";
import type { PublicMapData } from "@/app/map/[id]/publish/atoms/publicMapAtoms";
import type { ReactNode } from "react";

/**
 * Creates a Jotai store boundary.
 * Accepts initial values for mapId, viewId, mapMode, showNavbar,
 * and optionally publicMap from server components.
 *
 * When no explicit `mapMode` is provided, derives it from the URL
 * query parameter `?mode=publish` so that the first render is correct
 * (no flicker).
 */
export default function MapJotaiProvider({
  mapId,
  viewId,
  mapMode,
  showNavbar,
  publicMap,
  children,
}: {
  mapId: string;
  viewId?: string;
  mapMode?: MapMode;
  showNavbar: boolean;
  publicMap?: NonNullable<PublicMapData>;
  children: ReactNode;
}) {
  return (
    <Provider>
      <HydrateAtoms
        mapId={mapId}
        viewId={viewId}
        mapMode={mapMode}
        showNavbar={showNavbar}
        publicMap={publicMap}
      >
        {children}
      </HydrateAtoms>
    </Provider>
  );
}

function HydrateAtoms({
  mapId,
  showNavbar,
  viewId,
  mapMode,
  publicMap,
  children,
}: {
  mapId: string;
  showNavbar: boolean;
  viewId?: string;
  mapMode?: MapMode;
  publicMap?: NonNullable<PublicMapData>;
  children: ReactNode;
}) {
  // When no explicit values are provided (private route layout),
  // derive them from the URL so the very first render is correct.
  const searchParams = useSearchParams();
  const resolvedMapMode: MapMode =
    mapMode ?? (searchParams.get("mode") === "publish" ? "public" : "private");
  const resolvedViewId = viewId ?? searchParams.get("viewId") ?? undefined;

  useHydrateAtoms([
    [mapIdAtom, mapId],
    [viewIdAtom, resolvedViewId || null],
    [mapModeAtom, resolvedMapMode],
    [showNavbarAtom, showNavbar || false],
    [publicMapAtom, publicMap || null],
    [activeTabIdAtom, publicMap?.dataSourceConfigs?.[0]?.dataSourceId || null],
  ]);

  return children;
}
