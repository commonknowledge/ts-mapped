"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/services/trpc/react";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSourceListItem = RouterOutputs["dataSource"]["listReadable"][number];
type DataSourceById = RouterOutputs["dataSource"]["byId"];
type DataSourceByOrganisation =
  RouterOutputs["dataSource"]["byOrganisation"][number];

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
      queryClient.invalidateQueries({
        queryKey: trpc.dataSource.byOrganisation.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.dataSource.byId.queryKey(),
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
      queryClient.setQueriesData(
        { queryKey: trpc.dataSource.byOrganisation.queryKey() },
        (old: DataSourceByOrganisation[] | undefined) =>
          old?.map((ds) =>
            ds.id === dataSourceId
              ? { ...ds, ...updater(ds as unknown as DataSourceListItem) }
              : ds,
          ),
      );
      queryClient.setQueriesData(
        { queryKey: trpc.dataSource.byId.queryKey() },
        (old: DataSourceById | undefined) => {
          if (!old || old.id !== dataSourceId) return old;
          return { ...old, ...updater(old as unknown as DataSourceListItem) };
        },
      );
    },
    [queryClient, trpc],
  );

  return { invalidateAll, updateDataSource };
}
