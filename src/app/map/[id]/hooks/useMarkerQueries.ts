"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import {
  useIsPublicMapRoute,
  usePublicDataSourceIds,
} from "@/app/map/[id]/publish/hooks/usePublicMap";
import { getMarkerDataSourceIds } from "@/utils/map";
import type { MarkerFeatureWithoutDataSourceId } from "@/types";

export function useMarkerQueries() {
  const { mapConfig } = useMapConfig();
  const { view } = useMapViews();
  const isPublicMapRoute = useIsPublicMapRoute();
  const publicDataSourceIds = usePublicDataSourceIds();

  const dataSourceIds = useMemo(() => {
    return isPublicMapRoute
      ? publicDataSourceIds
      : getMarkerDataSourceIds(mapConfig);
  }, [mapConfig, isPublicMapRoute, publicDataSourceIds]);

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
        enabled: Boolean(view), // Prevent duplicate marker query while view is loading
        queryKey: ["markers", dataSourceId, filter, search],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set("filter", filter);
          params.set("search", search);
          const response = await fetch(
            `/api/data-sources/${dataSourceId}/markers?${params.toString()}`,
          );
          if (response.status === 404) {
            return [];
          }
          if (!response.ok) {
            throw new Error(`Bad response: ${response.status}`);
          }
          const data =
            (await response.json()) as MarkerFeatureWithoutDataSourceId[];
          // Add dataSourceId to the marker properties, ultimately to support marker click handlers
          return data.map((d) => ({
            ...d,
            properties: { ...d.properties, dataSourceId },
          }));
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
