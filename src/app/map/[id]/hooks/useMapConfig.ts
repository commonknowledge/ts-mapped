"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useCallback, useMemo } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { useMapQuery } from "./useMapQuery";
import type { MapConfig } from "@/server/models/Map";

export function useMapConfig() {
  const { mapId } = use(MapContext);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: mapData } = useMapQuery(mapId);

  const { mutate, isPending } = useMutation(
    trpc.map.updateConfig.mutationOptions({
      onMutate: ({ config, mapId }) => {
        queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
          if (!old) return old;
          const updatedConfig = {
            ...old.config,
            ...config,
          };
          return { ...old, config: updatedConfig };
        });
      },
    }),
  );

  const mapConfig = useMemo(
    () =>
      mapData?.config || { markerDataSourceIds: [], membersDataSourceId: null },
    [mapData?.config],
  );

  const updateMapConfig = useCallback(
    (newMapConfig: Partial<MapConfig>) => {
      if (!mapId) {
        return;
      }
      return mutate({ mapId, config: { ...mapConfig, ...newMapConfig } });
    },
    [mapConfig, mapId, mutate],
  );

  return {
    mapConfig,
    updateMapConfig,
    isDirty: isPending
  };
}
