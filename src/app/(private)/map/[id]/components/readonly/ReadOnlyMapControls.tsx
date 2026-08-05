"use client";

import { useEffect } from "react";
import { MapType } from "@/models/MapView";
import { useMapViews } from "../../hooks/useMapViews";
import BoundaryHoverInfo from "../BoundaryHoverInfo/BoundaryHoverInfo";
import InspectorPanel from "../InspectorPanel/InspectorPanel";
import LegendDisplay from "../Legend/LegendDisplay";
import MarkerLegend from "../Legend/MarkerLegend";
import MapStyleSelector from "../MapStyleSelector";
import TimelineControl from "../TimelineControl";
import ZoomControl from "../ZoomControl";

/**
 * Map furniture for the read-only shared map page: the boundary hover
 * info, the inspector, display-only legends, and the map style / zoom /
 * timeline controls. No control panels, no draw or pin-drop modes.
 */
export default function ReadOnlyMapControls() {
  const { viewConfig } = useMapViews();

  // Lets global.css place the report-a-bug trigger in a row with the map's
  // zoom controls (it defaults to the corner the zoom controls occupy)
  useEffect(() => {
    document.body.classList.add("map-page");
    return () => document.body.classList.remove("map-page");
  }, []);

  return (
    <>
      <div className="absolute top-5 left-4 right-4 bottom-[100px] z-10 pointer-events-none flex justify-between items-start gap-4">
        <BoundaryHoverInfo />
        <InspectorPanel />
      </div>

      <div className="absolute bottom-8 left-8 z-10 hidden md:flex flex-col gap-2 w-64 pointer-events-auto">
        <MarkerLegend />
        <LegendDisplay />
        <MapStyleSelector />
      </div>

      <div className="map-zoom-controls / absolute bottom-8 right-8 z-10 hidden md:block">
        <ZoomControl />
      </div>

      {viewConfig.mapType !== MapType.Hex && (
        <div
          className="absolute left-1/2 z-10"
          style={{ transform: "translate(-50%)", bottom: "32px" }}
        >
          <TimelineControl />
        </div>
      )}
    </>
  );
}
