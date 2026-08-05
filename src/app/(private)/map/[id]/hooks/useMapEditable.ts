"use client";

import { useAtomValue } from "jotai";
import { isReadOnlyRouteAtom } from "../atoms/mapStateAtoms";

/** `true` on the read-only shared map page (`/share/[token]`). */
export function useIsReadOnlyRoute() {
  return useAtomValue(isReadOnlyRouteAtom);
}

/**
 * Whether the current viewer may edit the map. `false` only on the
 * read-only shared map page — components use this to hide editing
 * affordances (inspector config, add-to-areas, view-in-table, etc.).
 */
export function useMapEditable() {
  return !useAtomValue(isReadOnlyRouteAtom);
}
