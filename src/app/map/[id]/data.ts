import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CalculationType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { useChoropleth } from "./hooks/useChoropleth";
import { useMapBounds } from "./hooks/useMapBounds";
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
  calculationType: CalculationType;
  dataSourceId: string;

  primary: {
    column: string;
    columnType: ColumnType;
    maxValue: number;
    minValue: number;
  } | null;

  secondary: {
    column: string;
    columnType: ColumnType;
    maxValue: number;
    minValue: number;
  } | null;

  stats: CombinedAreaStat[];
}

export const useAreaStats = () => {
  const { boundingBox } = useMapBounds();
  const { viewConfig } = useMapViews();
  const {
    choroplethLayerConfig: { areaSetCode, requiresBoundingBox },
  } = useChoropleth();
  const {
    calculationType,
    areaDataColumn: column,
    areaDataSecondaryColumn: secondaryColumn,
    areaDataSourceId: dataSourceId,
    areaDataNullIsZero: nullIsZero,
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
    calculationType: CalculationType;
    dataSourceId: string;

    primary: {
      column: string;
      columnType: ColumnType;
      maxValue: number;
      minValue: number;
    } | null;

    secondary: {
      column: string;
      columnType: ColumnType;
      maxValue: number;
      minValue: number;
    } | null;

    stats: Record<string, CombinedAreaStat>;
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
        nullIsZero,
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
    nullIsZero,
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
      const primaryStats = areaStatsQuery.data.primary?.stats || [];
      for (const stat of primaryStats) {
        nextStats[stat.areaCode] = {
          areaCode: stat.areaCode,
          primary: stat.value,
        };
      }

      const secondaryStats = areaStatsQuery.data.secondary?.stats || [];
      for (const stat of secondaryStats) {
        const prevStat = nextStats[stat.areaCode] || {
          areaCode: stat.areaCode,
        };
        nextStats[stat.areaCode] = { ...prevStat, secondary: stat.value };
      }

      if (!prev) {
        return {
          areaSetCode: areaStatsQuery.data.areaSetCode,
          calculationType: areaStatsQuery.data.calculationType,
          dataSourceId: areaStatsQuery.data.dataSourceId,
          primary: areaStatsQuery.data.primary
            ? {
                column: areaStatsQuery.data.primary.column,
                columnType: areaStatsQuery.data.primary.columnType,
                maxValue: areaStatsQuery.data.primary.maxValue,
                minValue: areaStatsQuery.data.primary.minValue,
                stats: primaryStats,
              }
            : null,
          secondary: areaStatsQuery.data.secondary
            ? {
                column: areaStatsQuery.data.secondary.column,
                columnType: areaStatsQuery.data.secondary.columnType,
                maxValue: areaStatsQuery.data.secondary.maxValue,
                minValue: areaStatsQuery.data.secondary.minValue,
                stats: secondaryStats,
              }
            : null,
          stats: nextStats,
        };
      }

      if (
        prev.areaSetCode === areaStatsQuery.data.areaSetCode &&
        prev.calculationType === areaStatsQuery.data.calculationType &&
        prev.dataSourceId === areaStatsQuery.data.dataSourceId &&
        prev.primary?.column === areaStatsQuery.data.primary?.column &&
        prev.secondary?.column === areaStatsQuery.data.secondary?.column
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
          ...dedupedAreaStats,
          stats: Object.values(dedupedAreaStats.stats),
        }
      : null;
  }, [dedupedAreaStats]);

  return { data: areaStats, isFetching: areaStatsQuery.isFetching };
};
