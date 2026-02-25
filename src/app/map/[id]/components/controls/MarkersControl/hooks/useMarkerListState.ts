import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { mapColors } from "@/app/map/[id]/styles";
import { useTRPC } from "@/services/trpc/react";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export function useMarkerListState(placedMarkers: PlacedMarker[]) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const mapId = useMapId();
  const { mapConfig } = useMapConfig();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [pulsingFolderId, _setPulsingFolderId] = useState<string | null>(null);
  const [keyboardCapture, setKeyboardCapture] = useState(false);

  // Brief pulsing folder animation on some drag actions
  const setPulsingFolderId = useCallback((id: string | null) => {
    _setPulsingFolderId(id);
    setTimeout(() => {
      _setPulsingFolderId(null);
    }, 600);
  }, []);

  // Update cache only (for optimistic updates during drag) - NO mutation
  const updateMarkerInCache = useCallback(
    (placedMarker: Omit<PlacedMarker, "mapId">) => {
      if (!mapId) return;

      const fullMarker = {
        ...placedMarker,
        mapId,
        folderId: placedMarker.folderId ?? null,
      };

      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          placedMarkers:
            old.placedMarkers?.map((m) =>
              m.id === placedMarker.id ? fullMarker : m,
            ) || [],
        };
      });
    },
    [mapId, queryClient, trpc.map.byId],
  );

  // Get active marker and color for drag overlay
  const getActiveMarker = useCallback(() => {
    if (!activeId) return null;
    const markerId = activeId.replace("marker-", "");
    return placedMarkers.find((marker) => marker.id === markerId) || null;
  }, [activeId, placedMarkers]);

  const getActiveMarkerColor = useCallback(() => {
    const marker = getActiveMarker();
    if (!marker) return mapColors.markers.color;

    // Get marker color (check explicit marker color first, then folder color, then default)
    if (mapConfig.placedMarkerColors?.[marker.id]) {
      return mapConfig.placedMarkerColors[marker.id];
    }
    if (marker.folderId && mapConfig.folderColors?.[marker.folderId]) {
      return mapConfig.folderColors[marker.folderId];
    }
    return mapColors.markers.color;
  }, [getActiveMarker, mapConfig]);

  return {
    activeId,
    setActiveId,
    pulsingFolderId,
    keyboardCapture,
    setKeyboardCapture,
    updateMarkerInCache,
    setPulsingFolderId,
    getActiveMarker,
    getActiveMarkerColor,
  };
}
