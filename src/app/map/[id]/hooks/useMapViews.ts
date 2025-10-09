"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { MapContext, ViewConfig } from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "../utils";
import { useMapQuery } from "./useMapQuery";
import type { View } from "../types";

export function useMapViews() {
  const { viewId, mapId, setDirtyViewIds } = use(MapContext);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: mapData } = useMapQuery(mapId);

  // Get views directly from cache
  const views = useMemo(() => mapData?.views || [], [mapData?.views]);

  const view = useMemo(
    () => views.find((v) => v.id === viewId) || null,
    [viewId, views],
  );

  const viewConfig = useMemo(() => {
    return new ViewConfig({ ...view?.config });
  }, [view]);

  const updateViewConfig = useCallback(
    (nextViewConfig: Partial<ViewConfig>) => {
      if (!mapId || !viewId) return;

      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;

        const currentView = old.views.find((v) => v.id === viewId);
        if (!currentView) return old;

        const nextView = {
          ...currentView,
          config: new ViewConfig({ ...currentView.config, ...nextViewConfig }),
        };

        return {
          ...old,
          views: old.views.map((v) => (v.id === currentView.id ? nextView : v)),
        };
      });

      setDirtyViewIds((prev) => [...prev, viewId]);
    },
    [viewId, mapId, queryClient, trpc.map.byId, setDirtyViewIds],
  );

  const insertView = useCallback(
    (view: Omit<View, "position">) => {
      if (!mapId) return;

      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          views: [
            ...old.views,
            { ...view, position: getNewLastPosition(old.views) },
          ],
        };
      });

      setDirtyViewIds((prev) => [...prev, view.id]);
    },
    [mapId, queryClient, trpc.map.byId, setDirtyViewIds],
  );

  const updateView = useCallback(
    (view: View) => {
      if (!mapId) return;

      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          views: old.views.map((v) => (v.id === view.id ? view : v)),
        };
      });

      setDirtyViewIds((prev) => [...prev, view.id]);
    },
    [mapId, queryClient, trpc.map.byId, setDirtyViewIds],
  );

  const { mutate: deleteViewMutate } = useMutation(
    trpc.mapView.delete.mutationOptions({
      onMutate: async ({ viewId }) => {
        if (!mapId) return;

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.map.byId.queryKey({ mapId }),
        });

        // Snapshot previous value
        const previousData = queryClient.getQueryData(
          trpc.map.byId.queryKey({ mapId }),
        );

        queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
          if (!old) return old;
          return {
            ...old,
            views: old.views.filter((v) => v.id !== viewId),
          };
        });

        return { previousData };
      },
      onSuccess: () => {
        toast.success("View deleted successfully");
      },
      onError: (_err, _variables, context) => {
        // Rollback on error
        if (mapId && context?.previousData) {
          queryClient.setQueryData(
            trpc.map.byId.queryKey({ mapId }),
            context.previousData,
          );
        }
        toast.error("Failed to delete view");
      },
    }),
  );

  const deleteView = useCallback(
    (viewId: string) => {
      if (!mapId) return;
      deleteViewMutate({ mapId, viewId });
    },
    [mapId, deleteViewMutate],
  );

  return {
    views,
    view,
    viewConfig,
    updateViewConfig,
    insertView,
    updateView,
    deleteView,
  };
}
