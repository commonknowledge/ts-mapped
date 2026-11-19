"use client";

import { useMapRoute } from "./useMapCore";

/**
 * Whether the current viewer may edit the map: `true` only in the private
 * map editor. Components shown on the read-only shared map page too use
 * this to hide editing affordances (inspector config, add-to-areas,
 * view-in-table, etc.).
 */
export function useMapEditable() {
  return useMapRoute() === "editor";
}
