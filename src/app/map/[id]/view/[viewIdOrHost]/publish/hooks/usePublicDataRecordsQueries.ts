import { useQueries } from "@tanstack/react-query";
import { useContext } from "react";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { SORT_BY_LOCATION, SORT_BY_NAME_COLUMNS } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { PublicMapContext } from "../context/PublicMapContext";
import type { RouterOutputs } from "@/services/trpc/react";

export function usePublicDataRecordsQueries() {
  const { publicMap, searchLocation } = useContext(PublicMapContext);
  const { view } = useMapViews();
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
            all: true,
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
