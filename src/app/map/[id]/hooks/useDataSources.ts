"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useContext, useMemo } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useTRPC } from "@/services/trpc/react";

export function useDataSources() {
  const trpc = useTRPC();
  const { data: dataSources = [], isPending } = useQuery(
    trpc.dataSource.listReadable.queryOptions(undefined, {
      refetchOnMount: "always",
    }),
  );

  const getDataSourceById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      return dataSources.find((ds) => ds.id === id) || null;
    },
    [dataSources],
  );

  return {
    dataSources,
    dataSourcesLoading: isPending,
    getDataSourceById,
  };
}

export function useChoroplethDataSource() {
  const { viewConfig } = useContext(MapContext);
  const { dataSources } = useDataSources();

  return useMemo(() => {
    if (!viewConfig.areaDataSourceId) return null;
    return (
      dataSources.find((ds) => ds.id === viewConfig.areaDataSourceId) || null
    );
  }, [dataSources, viewConfig.areaDataSourceId]);
}

export function useMarkerDataSources() {
  const { mapId } = useContext(MapContext);
  const { dataSources } = useDataSources();
  const { mapConfig } = useMapConfig(mapId);

  return useMemo(() => {
    return dataSources.filter((ds) =>
      mapConfig.markerDataSourceIds.includes(ds.id),
    );
  }, [dataSources, mapConfig.markerDataSourceIds]);
}

export function useMembersDataSource() {
  const { mapId } = useContext(MapContext);
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig(mapId);

  return useMemo(() => {
    return getDataSourceById(mapConfig.membersDataSourceId);
  }, [getDataSourceById, mapConfig.membersDataSourceId]);
}
