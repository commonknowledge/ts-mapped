"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useContext, useMemo } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
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
  const { viewConfig } = useContext(MapContext);
  const { data: dataSources } = useDataSources();

  return useMemo(() => {
    if (!viewConfig.areaDataSourceId) return null;
    return dataSources?.find((ds) => ds.id === viewConfig.areaDataSourceId);
  }, [dataSources, viewConfig.areaDataSourceId]);
}

export function useMarkerDataSources() {
  const { mapId } = useContext(MapContext);
  const { mapConfig } = useMapConfig(mapId);
  const { data: dataSources } = useDataSources();

  return useMemo(() => {
    return dataSources?.filter((ds) =>
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
