"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useTRPC } from "@/services/trpc/react";
import { useMapQuery } from "./useMapQuery";
import type { MapConfig } from "@/server/models/Map";

export function useMapConfig() {
  const { id: mapId } = useParams<{ id: string }>();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: mapData } = useMapQuery();

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
      if (!mapId) return;

      return mutate({ mapId, config: { ...mapConfig, ...newMapConfig } });
    },
    [mapConfig, mapId, mutate],
  );

  return {
    mapConfig,
    updateMapConfig,
    isUpdating: isPending,
  };
}
