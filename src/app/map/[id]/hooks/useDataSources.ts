"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTRPC } from "@/services/trpc/react";

export function useDataSources() {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.dataSource.listReadable.queryOptions(undefined, {
      refetchOnMount: "always",
    }),
  );

  const getDataSourceById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      return query.data?.find((ds) => ds.id === id) || null;
    },
    [query.data],
  );

  return {
    ...query,
    getDataSourceById,
  };
}

export function useChoroplethDataSource() {
  const { data: dataSources } = useDataSources();

  const { viewConfig } = useMapViews();

  return useMemo(() => {
    if (!viewConfig.areaDataSourceId) return null;
    return dataSources?.find((ds) => ds.id === viewConfig.areaDataSourceId);
  }, [dataSources, viewConfig.areaDataSourceId]);
}

export function useMarkerDataSources() {
  const { mapConfig } = useMapConfig();
  const { data: dataSources } = useDataSources();

  return useMemo(() => {
    return dataSources?.filter((ds) =>
      mapConfig.markerDataSourceIds.includes(ds.id),
    );
  }, [dataSources, mapConfig.markerDataSourceIds]);
}

export function useMembersDataSource() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();

  return useMemo(() => {
    return getDataSourceById(mapConfig.membersDataSourceId);
  }, [getDataSourceById, mapConfig.membersDataSourceId]);
}
