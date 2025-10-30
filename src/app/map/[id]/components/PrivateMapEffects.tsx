"use client";

import { useEffect } from "react";
import { LayerType } from "@/types";
import { useMapConfig } from "../hooks/useMapConfig";
import { useTurfsQuery } from "../hooks/useTurfs";
import { usePrivateMapStore } from "../stores/usePrivateMapStore";

// WE REALLY WANA DELETE THIS, DERIVE!!
export function PrivateMapEffects() {
  const hiddenLayers = usePrivateMapStore((s) => s.hiddenLayers);
  const setTurfVisibilityState = usePrivateMapStore(
    (s) => s.setTurfVisibilityState,
  );
  const setDataSourceVisibilityState = usePrivateMapStore(
    (s) => s.setDataSourceVisibilityState,
  );
  const { mapConfig } = useMapConfig();
  const { data: turfs = [] } = useTurfsQuery();

  // Handle side effects when layers are shown/hidden
  useEffect(() => {
    // When a layer visibility changes, update visibility for all items in that layer
    if (hiddenLayers.includes(LayerType.Member)) {
      if (mapConfig.membersDataSourceId) {
        setDataSourceVisibilityState(mapConfig.membersDataSourceId, false);
      }
    } else {
      if (mapConfig.membersDataSourceId) {
        setDataSourceVisibilityState(mapConfig.membersDataSourceId, true);
      }
    }
  }, [
    hiddenLayers,
    mapConfig.membersDataSourceId,
    setDataSourceVisibilityState,
  ]);

  useEffect(() => {
    // When turf layer visibility changes, update visibility for all turfs
    const isTurfLayerHidden = hiddenLayers.includes(LayerType.Turf);
    turfs.forEach((t) => setTurfVisibilityState(t.id, !isTurfLayerHidden));
  }, [hiddenLayers, turfs, setTurfVisibilityState]);

  return null;
}
