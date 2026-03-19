"use client";

import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useTRPC } from "@/services/trpc/react";
import {
  dropPinClickHandlerAtom,
  mapSearchResultAtom,
  placedMarkerVisibilityAtom,
  selectedPlacedMarkerIdAtom,
} from "../atoms/markerAtoms";
import { getNewLastPosition } from "../utils/position";
import { usePinDropMode, useSetPinDropMode } from "./useMapControls";
import { useMapId, useMapRef } from "./useMapCore";
import { useMapQuery } from "./useMapQuery";
import type { PlacedMarker } from "@/models/PlacedMarker";

export function usePlacedMarkersQuery() {
  const mapId = useMapId();
  const { data: mapData, isFetching } = useMapQuery(mapId);
  return {
    data: mapData?.placedMarkers,
    isFetching,
  };
}

export function usePlacedMarkerMutations() {
  const mapId = useMapId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: deletePlacedMarkerMutation } = useMutation(
    trpc.placedMarker.delete.mutationOptions({
      onMutate: async () => {
        if (!mapId) return;

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.map.byId.queryKey({ mapId }),
        });

        // Snapshot previous value for rollback
        const previousData = queryClient.getQueryData(
          trpc.map.byId.queryKey({ mapId }),
        );

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        // Rollback on error
        if (mapId && context?.previousData) {
          queryClient.setQueryData(
            trpc.map.byId.queryKey({ mapId }),
            context.previousData,
          );
        }
        toast.error("Failed to delete marker");
      },
    }),
  );

  const { mutate: upsertPlacedMarkerMutation } = useMutation(
    trpc.placedMarker.upsert.mutationOptions({
      onMutate: async () => {
        if (!mapId) return;

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.map.byId.queryKey({ mapId }),
        });

        // Snapshot previous value for rollback
        const previousData = queryClient.getQueryData(
          trpc.map.byId.queryKey({ mapId }),
        );

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        // Rollback on error
        if (mapId && context?.previousData) {
          queryClient.setQueryData(
            trpc.map.byId.queryKey({ mapId }),
            context.previousData,
          );
        }
        toast.error("Failed to save marker");
      },
    }),
  );

  const deletePlacedMarker = useCallback(
    (id: string) => {
      if (!mapId) return;

      // Optimistic update: remove from cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          placedMarkers: old.placedMarkers?.filter((m) => m.id !== id) || [],
        };
      });

      deletePlacedMarkerMutation({ placedMarkerId: id, mapId });
    },
    [mapId, queryClient, trpc.map.byId, deletePlacedMarkerMutation],
  );

  const insertPlacedMarker = useCallback(
    (newMarker: Omit<PlacedMarker, "position" | "mapId">) => {
      if (!mapId) return;

      // Get current markers for position calculation
      const mapData = queryClient.getQueryData(
        trpc.map.byId.queryKey({ mapId }),
      );
      const currentMarkers = mapData?.placedMarkers || [];

      const newPosition = getNewLastPosition(currentMarkers);
      // Optimistic update: add to cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          placedMarkers: [
            ...(old.placedMarkers || []),
            {
              ...newMarker,
              position: newPosition,
              mapId,
              folderId: newMarker.folderId ?? null,
            },
          ],
        };
      });

      upsertPlacedMarkerMutation({
        ...newMarker,
        position: newPosition,
        mapId,
      });
    },
    [mapId, queryClient, trpc.map.byId, upsertPlacedMarkerMutation],
  );

  const updatePlacedMarker = useCallback(
    (placedMarker: Omit<PlacedMarker, "mapId">) => {
      if (!mapId) return;

      const fullMarker = {
        ...placedMarker,
        mapId,
        folderId: placedMarker.folderId ?? null,
      };

      // Optimistic update: update in cache immediately
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

      upsertPlacedMarkerMutation(fullMarker);
    },
    [mapId, queryClient, trpc.map.byId, upsertPlacedMarkerMutation],
  );

  const isUpsertMutating = useIsMutating({
    mutationKey: trpc.placedMarker.upsert.mutationOptions().mutationKey,
  });

  return {
    deletePlacedMarker,
    insertPlacedMarker,
    updatePlacedMarker,
    isMutating: isUpsertMutating > 0,
  };
}

export function usePlacedMarkerState() {
  const [selectedPlacedMarkerId, setSelectedPlacedMarkerId] = useAtom(
    selectedPlacedMarkerIdAtom,
  );
  const [mapSearchResult, setMapSearchResult] = useAtom(mapSearchResultAtom);
  const [placedMarkerVisibility, _setPlacedMarkerVisibility] = useAtom(
    placedMarkerVisibilityAtom,
  );

  const setPlacedMarkerVisibility = useCallback(
    (markerId: string, isVisible: boolean) => {
      _setPlacedMarkerVisibility((prev) => ({
        ...prev,
        [markerId]: isVisible,
      }));
    },
    [_setPlacedMarkerVisibility],
  );

  const getPlacedMarkerVisibility = useCallback(
    (markerId: string) => {
      return placedMarkerVisibility[markerId] ?? true; // Default to visible
    },
    [placedMarkerVisibility],
  );

  return {
    selectedPlacedMarkerId,
    setSelectedPlacedMarkerId,
    mapSearchResult,
    setMapSearchResult,
    setPlacedMarkerVisibility,
    getPlacedMarkerVisibility,
  };
}

/**
 * Returns the handleDropPin callback. Safe to call from multiple components.
 * Does NOT include the cleanup effect — call useDropPinCleanupEffect once
 * in the component that owns the Mapbox map instance.
 */
export const useHandleDropPin = () => {
  const mapRef = useMapRef();
  const mapId = useMapId();
  const setPinDropMode = useSetPinDropMode();
  const { insertPlacedMarker } = usePlacedMarkerMutations();
  const dropPinClickHandler = useAtomValue(dropPinClickHandlerAtom);
  const setDropPinClickHandler = useSetAtom(dropPinClickHandlerAtom);

  const handleDropPin = useCallback(() => {
    const map = mapRef?.current;
    if (!map || !mapId) return;

    // Clear any existing handler first
    if (dropPinClickHandler) {
      map.off("click", dropPinClickHandler);
    }

    setPinDropMode(true);
    map.getCanvas().style.cursor = "crosshair";

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      insertPlacedMarker({
        id: uuidv4(),
        label: `Dropped Pin (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`,
        notes: "",
        point: e.lngLat,
        folderId: null,
      });

      map.off("click", clickHandler);
      setDropPinClickHandler(() => null);
      // Set pinDropMode to false; hover effect will reset cursor
      setPinDropMode(false);

      // Fly to the new marker
      map.flyTo({
        center: e.lngLat,
        zoom: 14,
      });
    };

    setDropPinClickHandler(() => clickHandler);
    map.once("click", clickHandler);
  }, [
    mapRef,
    mapId,
    setPinDropMode,
    insertPlacedMarker,
    dropPinClickHandler,
    setDropPinClickHandler,
  ]);

  return { handleDropPin };
};

/**
 * Cleanup effect that removes the Mapbox click handler and resets the cursor
 * when pinDropMode is disabled. Must be called in exactly one component
 * (the one that owns the Mapbox map instance, e.g. Map.tsx).
 */
export const useDropPinCleanupEffect = () => {
  const mapRef = useMapRef();
  const pinDropMode = usePinDropMode();
  const dropPinClickHandler = useAtomValue(dropPinClickHandlerAtom);
  const setDropPinClickHandler = useSetAtom(dropPinClickHandlerAtom);

  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    if (!pinDropMode && dropPinClickHandler) {
      map.off("click", dropPinClickHandler);
      setDropPinClickHandler(null);
      map.getCanvas().style.cursor = "";
    }
  }, [pinDropMode, mapRef, dropPinClickHandler, setDropPinClickHandler]);
};
