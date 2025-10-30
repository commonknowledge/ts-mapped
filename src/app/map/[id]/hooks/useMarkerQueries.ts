"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { getDataSourceIds } from "../stores/useMapStore";
import { usePublicMapStore } from "../view/[viewIdOrHost]/publish/stores/usePublicMapStore";
import type { PointFeature } from "@/types";

export function useMarkerQueries() {
  const { mapConfig } = useMapConfig();
  const { view } = useMapViews();
  const publicMap = usePublicMapStore((s) => s.publicMap);
  const dataSourceIds = useMemo(() => {
    if (!publicMap) return getDataSourceIds(mapConfig);

    // If a public map is being displayed, don't fetch markers that aren't included
    return getDataSourceIds(mapConfig).filter((id) =>
      publicMap.dataSourceConfigs.some((dsc) => dsc.dataSourceId === id),
    );
  }, [mapConfig, publicMap]);

  // Using the `combine` option in this useQueries call makes `markerQueries`
  // only update when the data updates. This prevents infinite loops
  // when `markerQueries` is used in useEffect hooks.
  const markerQueries = useQueries({
    queries: dataSourceIds.map((dataSourceId) => {
      const dsv = view?.dataSourceViews.find(
        (dsv) => dsv.dataSourceId === dataSourceId,
      );
      const filter = JSON.stringify(dsv?.filter || null);
      const search = dsv?.search || "";
      return {
        queryKey: ["markers", dataSourceId, filter, search],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set("filter", filter);
          params.set("search", search);
          const response = await fetch(
            `/api/data-sources/${dataSourceId}/markers?${params.toString()}`,
          );
          if (!response.ok) {
            throw new Error(`Bad response: ${response.status}`);
          }
          const data = await response.json();
          return data as PointFeature[];
        },
      };
    }),

    combine: (results) => {
      return {
        data: results.map((result, i) => ({
          dataSourceId: dataSourceIds[i],
          markers: result.data || [],
        })),
        isFetching: results.some((result) => result.isFetching),
      };
    },
  });

  return markerQueries;
}
