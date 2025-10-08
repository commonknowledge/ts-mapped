"use client";

import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { VisualisationType } from "@/__generated__/types";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { GeocodingType } from "@/server/models/DataSource";
import { CalculationType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import "mapbox-gl/dist/mapbox-gl.css";
import { getChoroplethLayerConfig } from "../sources";
import type { AreaStat } from "@/server/models/Area";
import type { RouterOutputs } from "@/services/trpc/react";
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

  const trpc = useTRPC();
  const areaStatsQuery = useQuery(
    trpc.area.stats.queryOptions(
      {
        areaSetCode: choroplethLayerConfig.areaSetCode || "",
        dataSourceId: viewConfig.areaDataSourceId,
        column: viewConfig.areaDataColumn,
        excludeColumns: viewConfig.excludeColumnsString
          .split(",")
          .filter(Boolean)
          .map((v) => v.trim()),
        calculationType: viewConfig.calculationType || CalculationType.Count,
        boundingBox: boundingBox || { north: 0, east: 0, south: 0, west: 0 },
      },
      {
        enabled: Boolean(
          choroplethLayerConfig.areaSetCode &&
            viewConfig.areaDataSourceId &&
            viewConfig.areaDataColumn,
        ),
      },
    ),
  );

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
          isFetching: areaStatsQuery.isFetching,
        },
        choroplethLayerConfig,
      }}
    >
      {children}
    </ChoroplethContext>
  );
}
