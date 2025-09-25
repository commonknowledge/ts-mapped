import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { VisualisationType } from "@/__generated__/types";
import { CalculationType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import type { ViewConfig } from "./context/MapContext";
import type { DataSourceMarkers } from "./types";
import type { DataSourceView } from "@/__generated__/types";
import type { AreaSetCode } from "@/server/models/AreaSet";

// Use API request instead of GraphQL to avoid server memory load
// TODO: replace with gql @stream directive when Apollo client supports it
export const useMarkerQueries = ({
  membersDataSourceId,
  markerDataSourceIds,
  dataSourceViews,
}: {
  membersDataSourceId: string;
  markerDataSourceIds: string[];
  dataSourceViews: DataSourceView[];
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DataSourceMarkers[]>([]);
  const cache = useRef<Record<string, DataSourceMarkers>>({});
  const cacheKeyByDataSource = useRef<Record<string, string>>({});

  useEffect(() => {
    const fetchMarkers = async () => {
      setLoading(true);
      setData([]);
      const dataSourceIds = [
        membersDataSourceId,
        ...markerDataSourceIds,
      ].filter(Boolean);
      try {
        for (const id of dataSourceIds) {
          const filter = JSON.stringify(
            dataSourceViews.find((dsv) => dsv.dataSourceId === id)?.filter ||
              null,
          );
          const search =
            dataSourceViews.find((dsv) => dsv.dataSourceId === id)?.search ||
            "";
          const cacheId = `${id}:${filter}:${search}`;
          if (!cache.current[cacheId]) {
            const params = new URLSearchParams();
            params.set("filter", filter);
            params.set("search", search);
            const response = await fetch(
              `/api/data-sources/${id}/markers?${params.toString()}`,
            );
            if (!response.ok) {
              throw new Error(`Bad response: ${response.status}`);
            }
            const dataSourceMarkers =
              (await response.json()) as DataSourceMarkers;
            cache.current[cacheId] = dataSourceMarkers;
          }
          cacheKeyByDataSource.current[id] = cacheId;
          // For each active cache key, get the cached value
          // which will be a DataSourceMarkers object
          setData(
            Object.values(cacheKeyByDataSource.current)
              .map((k) => cache.current[k])
              .filter(Boolean),
          );
        }
      } catch (e) {
        console.error("Fetch markers error", e);
        setError("Failed");
      }
      setLoading(false);
    };
    fetchMarkers();
  }, [dataSourceViews, markerDataSourceIds, membersDataSourceId]);

  return useMemo(() => ({ loading, data, error }), [data, error, loading]);
};

interface BoundingBox {
  north: number;
  east: number;
  south: number;
  west: number;
}

export const useAreaStatsQuery = ({
  viewConfig,
  areaSetCode,
  boundingBox,
}: {
  viewConfig: ViewConfig;
  areaSetCode: AreaSetCode;
  boundingBox: BoundingBox;
}) => {
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
    !dataSourceId || // Skip if user has not selected a data source
    !areaSetGroupCode || // Skip if user has not selected an area set group
    !viewIsChoropleth ||
    isMissingDataColumn;

  const trpc = useTRPC();
  return useQuery(
    trpc.area.stats.queryOptions(
      {
        areaSetCode,
        dataSourceId,
        column: columnOrCount,
        excludeColumns: viewConfig.getExcludeColumns(),
        boundingBox,
        calculationType: calculationType || CalculationType.Value,
      },
      { enabled: !skipCondition, placeholderData: keepPreviousData },
    ),
  );
};
