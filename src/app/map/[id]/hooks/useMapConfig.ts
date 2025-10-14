"use client";

import { useQueryClient } from "@tanstack/react-query";
import { use, useCallback, useContext, useMemo } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { useMapQuery } from "./useMapQuery";
import type { MapConfig } from "@/server/models/Map";

export function useMapConfig() {
  const { mapId } = use(MapContext);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: mapData } = useMapQuery(mapId);
  const { setConfigDirty } = useContext(MapContext);

  const updateMapConfig = useCallback(
    (nextMapConfig: Partial<MapConfig>) => {
      if (!mapId) return;

      // Optimistically update the cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        const updatedConfig = {
          ...old.config,
          ...nextMapConfig,
        };
        return { ...old, config: updatedConfig };
      });

      setConfigDirty(true);
    },
    [mapId, queryClient, trpc.map.byId, setConfigDirty],
  );

  const mapConfig = useMemo(
    () =>
      mapData?.config || { markerDataSourceIds: [], membersDataSourceId: null },
    [mapData?.config],
  );
  return {
    mapConfig,
    updateMapConfig,
  };
}
