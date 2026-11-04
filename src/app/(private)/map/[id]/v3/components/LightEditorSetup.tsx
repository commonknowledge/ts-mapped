"use client";

import { useHydrateAreasSharedAcrossViews } from "../../hooks/useAreaSettings";
import { useHydrateMarkerBehaviour } from "../../hooks/useMarkerAppearance";
import { useAutoStartTour } from "../hooks/useTour";

// Opts this map's Jotai scope into the light editor's ring markers, makes
// cluster clicks zoom in rather than fill the inspector, and shares the
// Areas list and inspector settings across the map's views. Hydrated, not
// set in an effect, so the map's first click already uses them. Starts the
// guided tour on the Sample Map.
export default function LightEditorSetup() {
  useHydrateMarkerBehaviour({ appearance: "ring", clusterClick: "zoom" });
  useHydrateAreasSharedAcrossViews();
  useAutoStartTour();
  return null;
}
