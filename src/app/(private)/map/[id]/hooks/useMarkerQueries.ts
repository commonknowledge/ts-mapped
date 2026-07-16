"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { useMapMode } from "@/app/(private)/map/[id]/hooks/useMapCore";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import {
  usePublicDataSourceIds,
  usePublicMapValue,
} from "@/app/(private)/map/[id]/publish/hooks/usePublicMap";
import { getMarkerDataSourceIds } from "@/utils/map";
import type { MarkerFeatureWithoutDataSourceId } from "@/types";

export function useMarkerQueries() {
  const { mapConfig } = useMapConfig();
  const { view } = useMapViews();
  const mapMode = useMapMode();
  const publicDataSourceIds = usePublicDataSourceIds();
  const publicMap = usePublicMapValue();

  // In public mode (the publish editor as well as the standalone public page)
  // markers follow the public map config; in private mode they follow the
  // full private marker data source list.
  const dataSourceIds = useMemo(() => {
    return mapMode === "public"
      ? publicDataSourceIds
      : getMarkerDataSourceIds(mapConfig);
  }, [mapConfig, mapMode, publicDataSourceIds]);

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

      // Columns used by this view's marker styling must be present on the
      // marker features for Mapbox match expressions to read them. Only
      // honoured by the server for authenticated readers. Sorted so the
      // query key is stable regardless of config field order.
      const visualisation = view?.config.markerVisualisations?.[dataSourceId];
      const propertyColumns = [
        ...new Set(
          [
            visualisation?.iconColumn,
            visualisation?.sizeColumn,
            visualisation?.colorColumn,
            visualisation?.boundaryChartColumn,
          ].filter((c): c is string => Boolean(c)),
        ),
      ].sort();
      const properties = JSON.stringify(propertyColumns);

      // When a public map exists, marker labels are built server-side from its
      // "Listing Title" config. Pass the viewId so the server loads the
      // authoritative config. The refetch on config change is driven by
      // useAutoSaveDraft invalidating ["markers"] *after* the draft is saved —
      // keeping the config out of the query key avoids refetching against a
      // not-yet-persisted draft.
      const publicMapViewId = publicMap?.viewId || null;

      return {
        enabled: Boolean(view), // Prevent duplicate marker query while view is loading
        queryKey: ["markers", dataSourceId, filter, search, properties],
        queryFn: async () => {
          const params = new URLSearchParams();
          params.set("filter", filter);
          params.set("search", search);
          if (propertyColumns.length > 0) {
            params.set("properties", properties);
          }
          if (publicMapViewId) {
            params.set("publicMapViewId", publicMapViewId);
          }
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
          // asJson pre-serialises each feature's key fields so the Mapbox
          // clusterProperties concat expression can aggregate them safely,
          // without any field values (e.g. names with commas) breaking the encoding.
          return data.map((d) => ({
            ...d,
            properties: {
              ...d.properties,
              dataSourceId,
              asJson: JSON.stringify({
                id: d.properties.id,
                dataSourceId,
                name: d.properties.name,
              }),
            },
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
