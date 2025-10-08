"use client";

import { useContext, useMemo, useState } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { GeocodingType } from "@/server/models/DataSource";
import "mapbox-gl/dist/mapbox-gl.css";
import { VisualisationType } from "@/server/models/MapView";
import { useAreaStats } from "../data";
import { getChoroplethLayerConfig } from "../sources";
import type { ReactNode } from "react";

export default function ChoroplethProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { boundingBox, viewConfig, zoom } = useContext(MapContext);
  const { getChoroplethDataSource } = useContext(DataSourcesContext);

  /* State */
  // Storing the last loaded source triggers re-render when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [boundariesPanelOpen, setBoundariesPanelOpen] = useState(false);

  /* Derived State */

  const choroplethLayerConfig = useMemo(() => {
    const dataSource = getChoroplethDataSource();
    const areaSetCode =
      dataSource?.geocodingConfig?.type === GeocodingType.Code
        ? dataSource?.geocodingConfig?.areaSetCode
        : undefined;

    return getChoroplethLayerConfig(
      viewConfig.visualisationType === VisualisationType.Choropleth
        ? areaSetCode
        : undefined,
      viewConfig.areaSetGroupCode,
      zoom,
    );
  }, [
    getChoroplethDataSource,
    viewConfig.areaSetGroupCode,
    viewConfig.visualisationType,
    zoom,
  ]);

  const areaStatsData = useAreaStats({
    viewConfig,
    areaSetCode: choroplethLayerConfig.areaSetCode,
    boundingBox,
  });

  return (
    <ChoroplethContext
      value={{
        boundariesPanelOpen,
        setBoundariesPanelOpen,

        lastLoadedSourceId,
        setLastLoadedSourceId,

        areaStatsQuery: {
          data: areaStatsData.data,
          isFetching: areaStatsData.isFetching,
        },
        choroplethLayerConfig,
      }}
    >
      {children}
    </ChoroplethContext>
  );
}
