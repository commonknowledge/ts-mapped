"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { markerAppearanceAtom } from "../atoms/markerAtoms";

export function useMarkerAppearance() {
  return useAtomValue(markerAppearanceAtom);
}

export function useSetMarkerAppearance() {
  return useSetAtom(markerAppearanceAtom);
}
