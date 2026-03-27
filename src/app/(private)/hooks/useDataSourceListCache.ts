"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/services/trpc/react";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSourceListItem = RouterOutputs["dataSource"]["listReadable"][number];

export function useDataSourceListCache() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.dataSource.listPublic.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.dataSource.listReadable.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.dataSource.listForMapView.queryKey(),
      }),
    ]);
  }, [queryClient, trpc]);

  const updateDataSource = useCallback(
    (
      dataSourceId: string,
      updater: (ds: DataSourceListItem) => DataSourceListItem,
    ) => {
      const mapUpdater = (old: DataSourceListItem[] | undefined) =>
        old?.map((ds) => (ds.id === dataSourceId ? updater(ds) : ds));
      queryClient.setQueriesData(
        { queryKey: trpc.dataSource.listPublic.queryKey() },
        mapUpdater,
      );
      queryClient.setQueriesData(
        { queryKey: trpc.dataSource.listReadable.queryKey() },
        mapUpdater,
      );
      queryClient.setQueriesData(
        { queryKey: trpc.dataSource.listForMapView.queryKey() },
        mapUpdater,
      );
    },
    [queryClient, trpc],
  );

  return { invalidateAll, updateDataSource };
}
