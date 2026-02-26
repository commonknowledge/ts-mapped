import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  CalculationType,
  DEFAULT_CALCULATION_TYPE,
} from "@/server/models/MapView";
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

  // Return blank data if the user doesn't have an area set group selected
  // This fixes a bug when switching from the default area set (WMC24)
  // and "No locality" - the choropleth wouldn't reappear when switching
  // back to WMC24
  const safeAreaSetCode = areaSetGroupCode ? areaSetCode : null;

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

  const includeColumns = useMemo(() => {
    if (!viewConfig.includeColumnsString) return null;
    const columns = viewConfig.includeColumnsString
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    return columns.length > 0 ? columns : null;
  }, [viewConfig.includeColumnsString]);

  // The results of this query aren't used directly, as data for different
  // bounding boxes needs to be added together. Instead, useEffect is used
  // to add incoming data to the dedupedAreaStats state.
  const areaStatsQuery = useTanstackQuery(
    trpc.area.stats.queryOptions(
      {
        areaSetCode: safeAreaSetCode,
        calculationType: calculationType || DEFAULT_CALCULATION_TYPE,
        dataSourceId,
        column: columnOrCount,
        secondaryColumn: secondaryColumn,
        nullIsZero,
        includeColumns,
        boundingBox: requiresBoundingBox ? boundingBox : null,
      },
      { enabled: !skipCondition },
    ),
  );

  // Reset area stats when calculation changes
  // Note: this only works if all the useEffect dependencies trigger a change in areaStatsQuery.data
  const calcKey = JSON.stringify([
    safeAreaSetCode,
    calculationType,
    dataSourceId,
    column,
    secondaryColumn,
    nullIsZero,
    includeColumns,
  ]);

  useEffect(() => {
    setDedupedAreaStats(null);
  }, [calcKey]);

  // Store area stats when queries complete, and aggregate data for different bounding boxes
  useEffect(() => {
    const areaStatsData = areaStatsQuery.data;
    if (!areaStatsData) {
      return;
    }
    setDedupedAreaStats((prev) => {
      const nextStats: Record<
        string,
        { areaCode: string; primary?: unknown; secondary?: unknown }
      > = {};
      const primaryStats = areaStatsData.primary?.stats || [];
      for (const stat of primaryStats) {
        nextStats[stat.areaCode] = {
          areaCode: stat.areaCode,
          primary: stat.value,
        };
      }

      const secondaryStats = areaStatsData.secondary?.stats || [];
      for (const stat of secondaryStats) {
        const prevStat = nextStats[stat.areaCode] || {
          areaCode: stat.areaCode,
        };
        nextStats[stat.areaCode] = { ...prevStat, secondary: stat.value };
      }

      if (!prev) {
        return {
          areaSetCode: areaStatsData.areaSetCode,
          calculationType: areaStatsData.calculationType,
          dataSourceId: areaStatsData.dataSourceId,
          primary: areaStatsData.primary
            ? {
                column: areaStatsData.primary.column,
                columnType: areaStatsData.primary.columnType,
                maxValue: areaStatsData.primary.maxValue,
                minValue: areaStatsData.primary.minValue,
                stats: primaryStats,
              }
            : null,
          secondary: areaStatsData.secondary
            ? {
                column: areaStatsData.secondary.column,
                columnType: areaStatsData.secondary.columnType,
                maxValue: areaStatsData.secondary.maxValue,
                minValue: areaStatsData.secondary.minValue,
                stats: secondaryStats,
              }
            : null,
          stats: nextStats,
        };
      }

      if (
        prev.areaSetCode === areaStatsData.areaSetCode &&
        prev.calculationType === areaStatsData.calculationType &&
        prev.dataSourceId === areaStatsData.dataSourceId &&
        prev.primary?.column === areaStatsData.primary?.column &&
        prev.secondary?.column === areaStatsData.secondary?.column
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
