"use client";

import { useContext, useMemo, useState } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useChoroplethDataSource } from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { GeocodingType } from "@/server/models/DataSource";
import { VisualisationType } from "@/server/models/MapView";
import "mapbox-gl/dist/mapbox-gl.css";
import { getChoroplethLayerConfig } from "../sources";
import type { ReactNode } from "react";

export default function ChoroplethProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { zoom } = useContext(MapContext);
  const { viewConfig } = useMapViews();
  const choroplethDataSource = useChoroplethDataSource();

  /* State */
  // Storing the last loaded source triggers re-render when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [boundariesPanelOpen, setBoundariesPanelOpen] = useState(false);

  /* Derived State */

  const choroplethLayerConfig = useMemo(() => {
    const areaSetCode =
      choroplethDataSource?.geocodingConfig?.type === GeocodingType.Code
        ? choroplethDataSource?.geocodingConfig?.areaSetCode
        : undefined;

    return getChoroplethLayerConfig(
      viewConfig.visualisationType === VisualisationType.Choropleth
        ? areaSetCode
        : undefined,
      viewConfig.areaSetGroupCode,
      zoom,
    );
  }, [
    choroplethDataSource,
    viewConfig.areaSetGroupCode,
    viewConfig.visualisationType,
    zoom,
  ]);

  return (
    <ChoroplethContext
      value={{
        boundariesPanelOpen,
        setBoundariesPanelOpen,

        lastLoadedSourceId,
        setLastLoadedSourceId,
        choroplethLayerConfig,
      }}
    >
      {children}
    </ChoroplethContext>
  );
}
