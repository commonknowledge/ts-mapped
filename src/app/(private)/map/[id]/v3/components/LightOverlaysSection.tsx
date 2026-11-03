"use client";

import { MapType } from "@/models/MapView";
import { useMapViews } from "../../hooks/useMapViews";
import LightCustomAreas from "./LightCustomAreas";
import LightOverlayBoundaries from "./LightOverlayBoundaries";
import LightSection from "./LightSection";

// Lines and shapes drawn on top of the map; never coloured by data, so they
// live apart from the Areas visualisations
export default function LightOverlaysSection() {
  const { viewConfig } = useMapViews();

  if (viewConfig.mapType === MapType.Hex) {
    return null;
  }

  return (
    <LightSection label="Overlays">
      <LightOverlayBoundaries />
      <LightCustomAreas />
    </LightSection>
  );
}
