"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { MapContext } from "@/components/Map/context/MapContext";
import { useAreaStatsQuery } from "@/components/Map/data";
import { getChoroplethLayerConfig } from "@/components/Map/sources";
import { GeocodingType } from "@/server/models/DataSource";
import { VisualisationType } from "@/server/models/MapView";
import { ChoroplethContext } from "../context/ChoroplethContext";
import { DataSourcesContext } from "../context/DataSourcesContext";
import type { AreaStat } from "@/server/models/Area";
import type { RouterOutputs } from "@/services/trpc/react";
import "mapbox-gl/dist/mapbox-gl.css";
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

  const areaStatsQuery = useAreaStatsQuery({
    viewConfig,
    areaSetCode: choroplethLayerConfig.areaSetCode,
    boundingBox: boundingBox || { north: 0, east: 0, south: 0, west: 0 },
  });

  const [areaStatsData, setAreaStatsData] = useState<
    RouterOutputs["area"]["stats"] | undefined
  >(undefined);

  useEffect(() => {
    if (!areaStatsQuery.data) return;
    setAreaStatsData((s) => {
      const newStats = [
        ...(s?.stats || []),
        ...(areaStatsQuery.data?.stats || []),
      ];
      const deduped: Record<string, AreaStat> = {};
      for (const d of newStats) {
        deduped[d.areaCode] = d;
      }
      const stats = Object.values(deduped);

      return { ...s, ...areaStatsQuery.data, stats };
    });
  }, [areaStatsQuery.data]);

  return (
    <ChoroplethContext
      value={{
        boundariesPanelOpen,
        setBoundariesPanelOpen,

        lastLoadedSourceId,
        setLastLoadedSourceId,

        areaStatsQuery: {
          data: areaStatsData,
          isPending: areaStatsQuery.isPending,
        },
        choroplethLayerConfig,
      }}
    >
      {children}
    </ChoroplethContext>
  );
}
