"use client";

import { useHydrateAreasSharedAcrossViews } from "../../hooks/useAreaSettings";
import { useHydrateMarkerBehaviour } from "../../hooks/useMarkerAppearance";

// Opts this map's Jotai scope into the light editor's ring markers, makes
// cluster clicks zoom in rather than fill the inspector, and shares the
// Areas list and inspector settings across the map's views. Hydrated, not
// set in an effect, so the map's first click already uses them.
export default function LightEditorSetup() {
  useHydrateMarkerBehaviour({ appearance: "ring", clusterClick: "zoom" });
  useHydrateAreasSharedAcrossViews();
  return null;
}
