import { useQueries } from "@tanstack/react-query";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { SORT_BY_LOCATION, SORT_BY_NAME_COLUMNS } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { usePublicDataSourceIds, useSearchLocation } from "./usePublicMap";
import type { RouterOutputs } from "@/services/trpc/react";

export function usePublicDataRecordsQueries() {
  const searchLocation = useSearchLocation();
  const { view } = useMapViews();
  const trpc = useTRPC();

  const dataSourceIds = usePublicDataSourceIds();

  return useQueries({
    queries: dataSourceIds.map((dataSourceId) => {
      const filter = view?.dataSourceViews.find(
        (dsv) => dsv.dataSourceId === dataSourceId,
      )?.filter;

      const sort = searchLocation
        ? [{ name: SORT_BY_LOCATION, location: searchLocation, desc: false }]
        : [{ name: SORT_BY_NAME_COLUMNS, desc: false }];

      return trpc.dataSource.byIdWithRecords.queryOptions({
        dataSourceId,
        filter,
        sort,
        all: true,
      });
    }),
    combine: (results) => {
      const dataRecordsQueries: Record<
        string,
        {
          data: RouterOutputs["dataSource"]["byIdWithRecords"] | undefined;
          isPending: boolean;
        }
      > = {};

      dataSourceIds.forEach((dataSourceId, index) => {
        const result = results[index];
        dataRecordsQueries[dataSourceId] = {
          data: result?.data,
          isPending: result?.isPending ?? false,
        };
      });

      return dataRecordsQueries;
    },
  });
}
