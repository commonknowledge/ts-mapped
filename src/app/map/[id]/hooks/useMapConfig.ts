"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { useMapQuery } from "./useMapQuery";

export class MapConfig {
  public markerDataSourceIds: string[] = [];
  public membersDataSourceId: string | null = null;

  constructor(params: Partial<MapConfig> = {}) {
    Object.assign(this, params);
  }

  getDataSourceIds() {
    return new Set([this.membersDataSourceId].concat(this.markerDataSourceIds))
      .values()
      .toArray()
      .filter(Boolean);
  }
}

export function useMapConfig(mapId: string | null | undefined) {
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
        const updatedConfig = new MapConfig({
          ...old.config,
          ...nextMapConfig,
        });
        return { ...old, config: updatedConfig };
      });

      setConfigDirty(true);
    },
    [mapId, queryClient, trpc.map.byId, setConfigDirty],
  );

  return {
    mapConfig: new MapConfig(mapData?.config),
    updateMapConfig,
  };
}
