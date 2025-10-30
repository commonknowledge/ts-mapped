import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMapQuery } from "@/app/map/[id]/hooks/useMapQuery";
import { useMapStore } from "@/app/map/[id]/stores/useMapStore";
import { SORT_BY_LOCATION, SORT_BY_NAME_COLUMNS } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { usePublicMapStore } from "../stores/usePublicMapStore";
import type { RouterOutputs } from "@/services/trpc/react";

export function usePublicDataRecordsQueries() {
  const publicMap = usePublicMapStore((s) => s.publicMap);
  const searchLocation = usePublicMapStore((s) => s.searchLocation);

  const viewId = useMapStore((s) => s.viewId);
  const { data: mapData } = useMapQuery();
  // Get views directly from cache
  const views = mapData?.views;
  const view = useMemo(
    () => views?.find((v) => v.id === viewId) || null,
    [viewId, views],
  );

  const trpc = useTRPC();

  return useQueries({
    queries:
      publicMap?.dataSourceConfigs.map((config) => {
        const filter = view?.dataSourceViews.find(
          (dsv) => dsv.dataSourceId === config.dataSourceId,
        )?.filter;

        const sort = searchLocation
          ? [{ name: SORT_BY_LOCATION, location: searchLocation, desc: false }]
          : [{ name: SORT_BY_NAME_COLUMNS, desc: false }];

        return trpc.dataSource.byIdWithRecords.queryOptions(
          {
            dataSourceId: config.dataSourceId,
            filter,
            sort,
            page: 0,
          },
          { refetchOnMount: "always" },
        );
      }) ?? [],
    combine: (results) => {
      const dataRecordsQueries: Record<
        string,
        {
          data: RouterOutputs["dataSource"]["byIdWithRecords"] | undefined;
          isPending: boolean;
        }
      > = {};

      publicMap?.dataSourceConfigs.forEach((config, index) => {
        const result = results[index];
        dataRecordsQueries[config.dataSourceId] = {
          data: result?.data,
          isPending: result?.isPending ?? false,
        };
      });

      return dataRecordsQueries;
    },
  });
}
