"use client";

import { useAtomValue } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { clusterClickAtom, markerAppearanceAtom } from "../atoms/markerAtoms";

export function useMarkerAppearance() {
  return useAtomValue(markerAppearanceAtom);
}

export function useClusterClick() {
  return useAtomValue(clusterClickAtom);
}

/** Sets this map's marker style and cluster click before its first render,
 *  so the first click already behaves as configured */
export function useHydrateMarkerBehaviour({
  appearance,
  clusterClick,
}: {
  appearance: "classic" | "ring";
  clusterClick: "inspect" | "zoom";
}) {
  useHydrateAtoms([
    [markerAppearanceAtom, appearance],
    [clusterClickAtom, clusterClick],
  ]);
}
