"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useCallback } from "react";
import { toast } from "sonner";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "../utils";
import { useMapQuery } from "./useMapQuery";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export function usePlacedMarkersQuery() {
  const { mapId } = use(MapContext);
  const { data: mapData, isFetching } = useMapQuery(mapId);
  return {
    data: mapData?.placedMarkers,
    isFetching,
  };
}

export function usePlacedMarkerMutations() {
  const { mapId } = use(MapContext);
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

  const { mutate: upsertPlacedMarkerMutation, isPending: upsertLoading } =
    useMutation(
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
              createdAt: new Date(),
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
        createdAt: new Date(),
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

  return {
    deletePlacedMarker,
    insertPlacedMarker,
    updatePlacedMarker,
    loading: upsertLoading,
  };
}
