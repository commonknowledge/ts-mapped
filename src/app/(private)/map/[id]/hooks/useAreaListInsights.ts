"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { DUMMY_COUNT_COLUMN } from "@/constants";
import { useDataSources } from "@/hooks/useDataSources";
import { CalculationType } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { useAreaStats } from "../data";
import { summariseAreaListColumn } from "../utils/areaList";
import { useMapConfig } from "./useMapConfig";
import { useMapViews } from "./useMapViews";
import type { AreaList } from "@/models/Map";

/** A column of figures for a list's areas, with how they compare */
export interface AreaListColumn {
  key: string;
  label: string;
  /** "list": what the list was picked by; "map": the column on the map */
  source: "list" | "map";
  isPending: boolean;
  valueByCode: Map<string, unknown>;
  isNumeric: boolean;
  listMean: number | null;
  allMean: number | null;
  /** For text columns (e.g. the winning party), the commonest values */
  topValues: [string, number][];
}

/**
 * What a list of areas holds: how many of each marker layer's records
 * (members, places) fall in its areas; the figures it was picked by, kept
 * whatever the map shows; and the column on the map, each compared with
 * all areas
 */
export function useAreaListInsights(list: AreaList) {
  const trpc = useTRPC();
  const { mapConfig } = useMapConfig();
  const { viewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { data: areaStats } = useAreaStats();

  // Each marker layer's count per area, on the list's boundaries
  const layerIds = [
    ...(mapConfig.membersDataSourceId ? [mapConfig.membersDataSourceId] : []),
    ...mapConfig.markerDataSourceIds,
  ];
  const layerQueries = useQueries({
    queries: layerIds.map((dataSourceId) =>
      trpc.area.stats.queryOptions({
        dataSourceId,
        areaSetCode: list.areaSetCode,
        calculationType: CalculationType.Sum,
        column: DUMMY_COUNT_COLUMN,
      }),
    ),
  });
  const layers = layerIds.map((id, index) => {
    const stats = layerQueries[index]?.data?.primary?.stats ?? [];
    const byCode = new Map(
      stats.map((stat) => [stat.areaCode, Number(stat.value) || 0]),
    );
    const total = stats.reduce(
      (sum, stat) => sum + (Number(stat.value) || 0),
      0,
    );
    const inList = list.areas.reduce(
      (sum, area) => sum + (byCode.get(area.code) ?? 0),
      0,
    );
    return {
      id,
      name: getDataSourceById(id)?.name ?? "Markers",
      isPending: layerQueries[index]?.isPending ?? true,
      byCode,
      inList,
      total,
    };
  });

  // The figures the list was picked by, for every area
  const origin = list.origin;
  const originQueries = useQueries({
    queries: (origin?.columns ?? []).map((column) =>
      trpc.area.ranking.queryOptions({
        dataSourceId: origin?.dataSourceId ?? "",
        areaSetCode: list.areaSetCode,
        calculationType: origin?.calculationType ?? CalculationType.Avg,
        column: column.name,
      }),
    ),
  });
  const originColumns = (origin?.columns ?? []).map(
    (column, index): AreaListColumn => {
      const rows = originQueries[index]?.data?.rows ?? [];
      const valueByCode = new Map<string, unknown>(
        rows.map((row) => [row.code, row.value]),
      );
      return {
        key: `list:${column.name}`,
        label: column.label,
        source: "list",
        isPending: originQueries[index]?.isPending ?? true,
        valueByCode,
        ...summariseAreaListColumn({
          list,
          valueByCode,
          allValues: rows.map((row) => row.value),
        }),
      };
    },
  );

  // The column on the map, when it's on the list's boundaries and isn't
  // one of the list's own
  const mapColumn = useMemo((): AreaListColumn | null => {
    if (!areaStats || areaStats.areaSetCode !== list.areaSetCode) return null;
    const name = areaStats.primary?.column;
    if (!name || name === DUMMY_COUNT_COLUMN) return null;
    const isOwn =
      origin?.dataSourceId === areaStats.dataSourceId &&
      origin.columns.some((column) => column.name === name);
    if (isOwn) return null;
    const label =
      getDataSourceById(viewConfig.areaDataSourceId)?.columnMetadata.find(
        (meta) => meta.name === name,
      )?.displayName || name;
    const valueByCode = new Map<string, unknown>(
      areaStats.stats.map((stat) => [stat.areaCode, stat.primary]),
    );
    return {
      key: "map",
      label,
      source: "map",
      isPending: false,
      valueByCode,
      ...summariseAreaListColumn({
        list,
        valueByCode,
        allValues: areaStats.stats.map((stat) => stat.primary),
      }),
    };
  }, [areaStats, getDataSourceById, list, origin, viewConfig.areaDataSourceId]);

  return {
    layers,
    columns: [...originColumns, ...(mapColumn ? [mapColumn] : [])],
  };
}
