"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTRPC } from "@/services/trpc/react";
import { useMapQuery } from "./useMapQuery";
import type { MapConfig as DbMapConfig } from "@/server/models/Map";

export class MapConfig implements DbMapConfig {
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

  const [localConfig, setLocalConfig] = useState<MapConfig>(new MapConfig());
  const [configDirty, setConfigDirty] = useState(false);

  // Sync local config with server data
  useEffect(() => {
    if (mapData?.config) {
      setLocalConfig(new MapConfig(mapData.config));
    }
  }, [mapData?.config]);

  const { mutate: saveConfigMutate } = useMutation(
    trpc.map.updateConfig.mutationOptions({
      onSuccess: () => {
        setConfigDirty(false);
        // Optimistically update the query cache
        if (mapId) {
          queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
            if (!old) return old;
            return { ...old, config: localConfig };
          });
        }
      },
    }),
  );

  const updateMapConfig = useCallback((nextMapConfig: Partial<MapConfig>) => {
    setLocalConfig((prev) => new MapConfig({ ...prev, ...nextMapConfig }));
    setConfigDirty(true);
  }, []);

  const saveMapConfig = useCallback(() => {
    if (!mapId) return;
    saveConfigMutate({ mapId, config: localConfig });
  }, [mapId, localConfig, saveConfigMutate]);

  // Auto-save when config changes
  useEffect(() => {
    if (!configDirty || !mapId) return;

    const handler = setTimeout(() => {
      saveMapConfig();
    }, 1000); // debounce 1s

    return () => clearTimeout(handler);
  }, [configDirty, mapId, saveMapConfig]);

  return {
    mapConfig: localConfig,
    updateMapConfig,
  };
}
