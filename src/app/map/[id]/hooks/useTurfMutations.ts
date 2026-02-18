"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/services/trpc/react";
import { useMapId } from "./useMapCore";
import type { Turf } from "@/server/models/Turf";

export function useTurfMutations() {
  const mapId = useMapId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: deleteTurfMutation } = useMutation(
    trpc.turf.delete.mutationOptions({
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
        toast.error("Failed to delete area");
      },
    }),
  );

  const { mutate: upsertTurfMutation, isPending: upsertLoading } = useMutation(
    trpc.turf.upsert.mutationOptions({
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
      onSuccess: () => {
        // Invalidate all list queries, as they all might filter based on this turf
        queryClient.invalidateQueries({
          queryKey: trpc.dataRecord.list.queryKey(),
        });
      },
      onError: (_err, _variables, context) => {
        // Rollback on error
        if (mapId && context?.previousData) {
          queryClient.setQueryData(
            trpc.map.byId.queryKey({ mapId }),
            context.previousData,
          );
        }
        toast.error("Failed to save area");
      },
    }),
  );

  const deleteTurf = useCallback(
    (id: string) => {
      if (!mapId) return;

      // Optimistic update: remove from cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          turfs: old.turfs?.filter((t) => t.id !== id) || [],
        };
      });

      deleteTurfMutation({ turfId: id, mapId });
    },
    [mapId, queryClient, trpc.map.byId, deleteTurfMutation],
  );

  const insertTurf = useCallback(
    (newTurf: Omit<Turf, "mapId" | "createdAt">) => {
      if (!mapId) return;

      // Optimistic update: add to cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          turfs: [
            ...(old.turfs || []),
            { ...newTurf, mapId, color: newTurf.color, createdAt: new Date() },
          ],
        };
      });

      upsertTurfMutation({ ...newTurf, mapId });
    },
    [mapId, queryClient, trpc.map.byId, upsertTurfMutation],
  );

  const updateTurf = useCallback(
    (turf: Omit<Turf, "mapId">) => {
      if (!mapId) return;

      // Optimistic update: update in cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          turfs:
            old.turfs?.map((t) =>
              t.id === turf.id ? { ...turf, color: turf.color, mapId } : t,
            ) || [],
        };
      });

      upsertTurfMutation({ ...turf, mapId });
    },
    [mapId, queryClient, trpc.map.byId, upsertTurfMutation],
  );

  return {
    deleteTurf,
    insertTurf,
    updateTurf,
    loading: upsertLoading,
  };
}
