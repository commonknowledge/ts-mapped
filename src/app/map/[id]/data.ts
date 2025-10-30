import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AreaSetCode } from "@/server/models/AreaSet";
import { CalculationType, VisualisationType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { useMapViews } from "./hooks/useMapViews";
import { useMapStore } from "./stores/useMapStore";
import type { AreaStat } from "@/server/models/Area";
import type { ColumnType } from "@/server/models/DataSource";

export const useAreaStats = () => {
  const boundingBox = useMapStore((s) => s.boundingBox);
  const { viewConfig } = useMapViews();
  const areaSetCode = useMapStore((s) => s.choroplethLayerConfig?.areaSetCode);
  const {
    calculationType,
    areaDataColumn: column,
    areaDataSourceId: dataSourceId,
    areaSetGroupCode,
    visualisationType,
  } = viewConfig;

  // Use a dummy column for counts to avoid un-necessary refetching
  const columnOrCount =
    calculationType === CalculationType.Count ? "__count" : column;

  const viewIsChoropleth = visualisationType === VisualisationType.Choropleth;
  const isMissingDataColumn =
    !column && calculationType !== CalculationType.Count;

  const skipCondition =
    !areaSetCode || // Skip if user has not selected an area set
    !dataSourceId || // Skip if user has not selected a data source
    !areaSetGroupCode || // Skip if user has not selected an area set group
    !viewIsChoropleth ||
    isMissingDataColumn;

  const trpc = useTRPC();

  // Deduplicate stats by area code
  const [dedupedAreaStats, setDedupedAreaStats] = useState<{
    column: string;
    columnType: ColumnType;
    stats: Record<string, AreaStat>;
  } | null>();

  const excludeColumns = useMemo(() => {
    return viewConfig.excludeColumnsString
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }, [viewConfig.excludeColumnsString]);

  // The results of this query aren't used directly, as data for different
  // bounding boxes needs to be added together. Instead, useEffect is used
  // to add incoming data to the dedupedAreaStats state.
  const areaStatsQuery = useTanstackQuery(
    trpc.area.stats.queryOptions(
      {
        areaSetCode: areaSetCode || AreaSetCode.WMC24,
        calculationType: calculationType || CalculationType.Value,
        dataSourceId,
        column: columnOrCount,
        excludeColumns,
        boundingBox,
      },
      { enabled: !skipCondition },
    ),
  );

  // Reset area stats when calculation changes
  // Note: this only works if all the useEffect dependencies trigger a change in areaStatsQuery.data
  useEffect(() => {
    setDedupedAreaStats(null);
  }, [areaSetCode, calculationType, dataSourceId, column, excludeColumns]);

  // Store area stats when queries complete, and aggregate data for different bounding boxes
  useEffect(() => {
    if (!areaStatsQuery.data) {
      return;
    }
    setDedupedAreaStats((prev) => {
      const nextStats = areaStatsQuery.data.stats.reduce(
        (o, s) => {
          o[s.areaCode] = s;
          return o;
        },
        {} as Record<string, AreaStat>,
      );

      if (!prev) {
        return {
          column: areaStatsQuery.data.column,
          columnType: areaStatsQuery.data.columnType,
          stats: nextStats,
        };
      }
      if (
        prev.column === areaStatsQuery.data.column &&
        prev.columnType === areaStatsQuery.data.columnType
      ) {
        return {
          ...prev,
          stats: { ...prev.stats, ...nextStats },
        };
      }
    });
  }, [areaStatsQuery.data]);

  // Return an array of stats for use in components, instead of an object
  const areaStats = useMemo(() => {
    return dedupedAreaStats
      ? {
          column: dedupedAreaStats.column,
          columnType: dedupedAreaStats.columnType,
          stats: Object.values(dedupedAreaStats.stats),
        }
      : null;
  }, [dedupedAreaStats]);

  return { data: areaStats, isFetching: areaStatsQuery.isFetching };
};
