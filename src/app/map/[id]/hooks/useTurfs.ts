"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/services/trpc/react";
import { editingTurfAtom, turfVisibilityAtom } from "../atoms/turfAtoms";
import { useMapId, useMapRef } from "./useMapCore";
import { useMapQuery } from "./useMapQuery";
import type { Turf } from "@/server/models/Turf";

export function useTurfsQuery() {
  const mapId = useMapId();
  const { data: mapData, isFetching } = useMapQuery(mapId);
  return { data: mapData?.turfs, isFetching };
}

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
            { ...newTurf, mapId, createdAt: new Date() },
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
              t.id === turf.id ? { ...turf, mapId } : t,
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

export function useTurfState() {
  const mapRef = useMapRef();
  const { data: turfs = [] } = useTurfsQuery();

  const [editingTurf, setEditingTurf] = useAtom(editingTurfAtom);
  const [turfVisibility, _setTurfVisibility] = useAtom(turfVisibilityAtom);

  const setTurfVisibility = useCallback(
    (turfId: string, isVisible: boolean) => {
      _setTurfVisibility((prev) => ({ ...prev, [turfId]: isVisible }));
    },
    [_setTurfVisibility],
  );

  const getTurfVisibility = useCallback(
    (turfId: string): boolean => {
      return turfVisibility[turfId] ?? true;
    },
    [turfVisibility],
  );

  const visibleTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      return getTurfVisibility(turf.id);
    });
  }, [turfs, getTurfVisibility]);

  const handleAddArea = useCallback(() => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon",
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
      }
    }
  }, [mapRef]);

  return {
    editingTurf,
    setEditingTurf,
    visibleTurfs,
    handleAddArea,
    turfVisibility,
    setTurfVisibility,
    getTurfVisibility,
  };
}
