import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { CalculationType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { ChoroplethContext } from "./context/ChoroplethContext";
import { MapBoundsContext } from "./context/MapBoundsContext";
import { useMapViews } from "./hooks/useMapViews";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { ColumnType } from "@/server/models/DataSource";

export interface CombinedAreaStat {
  areaCode: string;
  primary?: unknown;
  secondary?: unknown;
}

export interface CombinedAreaStats {
  areaSetCode: AreaSetCode;
  column: string;
  columnType: ColumnType;
  stats: CombinedAreaStat[];
  secondaryStats: {
    column: string;
    columnType: ColumnType;
  } | null;
}

export const useAreaStats = () => {
  const { boundingBox } = useContext(MapBoundsContext);
  const { viewConfig } = useMapViews();
  const {
    choroplethLayerConfig: { areaSetCode, requiresBoundingBox },
  } = useContext(ChoroplethContext);
  const {
    calculationType,
    areaDataColumn: column,
    areaDataSecondaryColumn: secondaryColumn,
    areaDataSourceId: dataSourceId,
    areaSetGroupCode,
  } = viewConfig;

  // Use a dummy column for counts to avoid un-necessary refetching
  const columnOrCount =
    calculationType === CalculationType.Count ? "__count" : column;

  const isMissingDataColumn =
    !column && calculationType !== CalculationType.Count;

  const skipCondition =
    !calculationType ||
    !dataSourceId || // Skip if user has not selected a data source
    !areaSetGroupCode || // Skip if user has not selected an area set group
    isMissingDataColumn;

  const trpc = useTRPC();

  // Deduplicate stats by area code
  const [dedupedAreaStats, setDedupedAreaStats] = useState<{
    areaSetCode: AreaSetCode;
    column: string;
    columnType: ColumnType;
    stats: Record<string, CombinedAreaStat>;
    secondaryStats: {
      column: string;
      columnType: ColumnType;
    } | null;
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
        areaSetCode,
        calculationType: calculationType || CalculationType.Avg,
        dataSourceId,
        column: columnOrCount,
        secondaryColumn: secondaryColumn,
        excludeColumns,
        boundingBox: requiresBoundingBox ? boundingBox : null,
      },
      { enabled: !skipCondition },
    ),
  );

  // Reset area stats when calculation changes
  // Note: this only works if all the useEffect dependencies trigger a change in areaStatsQuery.data
  const calcKey = JSON.stringify([
    areaSetCode,
    calculationType,
    dataSourceId,
    column,
    secondaryColumn,
    excludeColumns,
  ]);

  useEffect(() => {
    setDedupedAreaStats(null);
  }, [calcKey]);

  // Store area stats when queries complete, and aggregate data for different bounding boxes
  useEffect(() => {
    if (!areaStatsQuery.data) {
      return;
    }
    setDedupedAreaStats((prev) => {
      const nextStats: Record<
        string,
        { areaCode: string; primary?: unknown; secondary?: unknown }
      > = {};
      for (const stat of areaStatsQuery.data.stats) {
        nextStats[stat.areaCode] = {
          areaCode: stat.areaCode,
          primary: stat.value,
        };
      }

      for (const stat of areaStatsQuery.data.secondaryStats?.stats || []) {
        const prevStat = nextStats[stat.areaCode] || {
          areaCode: stat.areaCode,
        };
        nextStats[stat.areaCode] = { ...prevStat, secondary: stat.value };
      }

      if (!prev) {
        return {
          areaSetCode: areaStatsQuery.data.areaSetCode,
          column: areaStatsQuery.data.column,
          columnType: areaStatsQuery.data.columnType,
          stats: nextStats,
          secondaryStats: areaStatsQuery.data.secondaryStats
            ? {
                column: areaStatsQuery.data.secondaryStats.column,
                columnType: areaStatsQuery.data.secondaryStats.columnType,
              }
            : null,
        };
      }
      if (
        prev.column === areaStatsQuery.data.column &&
        prev.columnType === areaStatsQuery.data.columnType &&
        prev.secondaryStats?.column ===
          areaStatsQuery.data.secondaryStats?.column &&
        prev.secondaryStats?.columnType ===
          areaStatsQuery.data.secondaryStats?.columnType
      ) {
        return {
          ...prev,
          stats: { ...prev.stats, ...nextStats },
        };
      }
    });
  }, [areaStatsQuery.data]);

  // Return an array of stats for use in components, instead of an object
  const areaStats = useMemo((): CombinedAreaStats | null => {
    return dedupedAreaStats
      ? {
          areaSetCode: dedupedAreaStats.areaSetCode,
          column: dedupedAreaStats.column,
          columnType: dedupedAreaStats.columnType,
          stats: Object.values(dedupedAreaStats.stats),
          secondaryStats: dedupedAreaStats.secondaryStats
            ? {
                column: dedupedAreaStats.secondaryStats.column,
                columnType: dedupedAreaStats.secondaryStats.columnType,
              }
            : null,
        }
      : null;
  }, [dedupedAreaStats]);

  return { data: areaStats, isFetching: areaStatsQuery.isFetching };
};
