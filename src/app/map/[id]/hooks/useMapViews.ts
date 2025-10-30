"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  createNewViewConfig,
  useMapStore,
} from "@/app/map/[id]/stores/useMapStore";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "../utils";
import { useMapQuery } from "./useMapQuery";
import type { View } from "../types";
import type { MapViewConfig } from "@/server/models/MapView";

export function useMapViews() {
  const viewId = useMapStore((s) => s.viewId);
  const { id: mapId } = useParams<{ id: string }>();
  const setViewId = useMapStore((s) => s.setViewId);
  const setDirtyViewIds = useMapStore((s) => s.setDirtyViewIds);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: mapData } = useMapQuery();

  // Get views directly from cache
  const views = mapData?.views;

  const view = useMemo(
    () => views?.find((v) => v.id === viewId) || null,
    [viewId, views],
  );

  const viewConfig = useMemo(() => {
    return view?.config || createNewViewConfig();
  }, [view]);

  const { mutate: insertViewMutate } = useMutation(
    trpc.map.updateViews.mutationOptions({
      onMutate: async () => {
        if (!mapId) return;

        // Cancel outgoing refetches (so they don't overwrite our optimistic update)
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
        toast.error("Failed to create view");
      },
      onSuccess: (_data, _variables) => {
        setDirtyViewIds((ids) =>
          ids.filter((id) => !_variables.views.find((v) => v.id === id)),
        );
      },
    }),
  );

  const insertView = useCallback(
    (view: Omit<View, "position">) => {
      if (!mapId) return;

      const newView = {
        ...view,
        position: getNewLastPosition(views || []),
      };

      const newViews = [...(views || []), newView];

      setViewId(newView.id);
      setDirtyViewIds((ids) => ids.concat([newView.id]));

      // Synchronously update cache BEFORE calling mutation for instant UI feedback
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          views: newViews.map((v) => ({
            ...v,
            mapId,
            createdAt: new Date(),
          })),
        };
      });

      insertViewMutate({ mapId, views: newViews });
    },
    [
      mapId,
      views,
      setViewId,
      setDirtyViewIds,
      queryClient,
      trpc.map.byId,
      insertViewMutate,
    ],
  );

  const { mutate: updateViewMutate } = useMutation(
    trpc.map.updateViews.mutationOptions({
      onMutate: async () => {
        if (!mapId) return;

        // Cancel outgoing refetches (so they don't overwrite our optimistic update)
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
        toast.error("Failed to update view");
      },
      onSuccess: (_data, _variables) => {
        setDirtyViewIds((ids) =>
          ids.filter((id) => !_variables.views.find((v) => v.id === id)),
        );
      },
    }),
  );

  const updateView = useCallback(
    (view: View) => {
      if (!mapId) return;

      const updatedViews =
        views?.map((v) => (v.id === view.id ? view : v)) || [];

      setDirtyViewIds((ids) => ids.concat([view.id]));

      // Synchronously update cache BEFORE calling mutation for instant UI feedback
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          views: updatedViews.map((v) => ({
            ...v,
            mapId,
            createdAt:
              old.views.find((ov) => ov.id === v.id)?.createdAt || new Date(),
          })),
        };
      });

      updateViewMutate({ mapId, views: updatedViews });
    },
    [
      mapId,
      setDirtyViewIds,
      queryClient,
      trpc.map.byId,
      updateViewMutate,
      views,
    ],
  );

  const updateViewConfig = useCallback(
    (viewConfig: Partial<MapViewConfig>) => {
      if (!view) return;

      return updateView({ ...view, config: { ...view.config, ...viewConfig } });
    },
    [updateView, view],
  );

  const { mutate: deleteViewMutate } = useMutation(
    trpc.mapView.delete.mutationOptions({
      onMutate: async () => {
        if (!mapId) return;

        // Cancel outgoing refetches (so they don't overwrite our optimistic update)
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
        toast.error("Failed to delete view");
      },
    }),
  );

  const deleteView = useCallback(
    (viewId: string) => {
      if (!mapId) return;

      // Synchronously update cache BEFORE calling mutation for instant UI feedback
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          views: old.views.filter((v) => v.id !== viewId),
        };
      });

      deleteViewMutate({ mapId, viewId });
    },
    [mapId, queryClient, trpc.map.byId, deleteViewMutate],
  );

  return {
    views: views || [],
    view,
    viewConfig,
    updateViewConfig,
    insertView,
    updateView,
    deleteView,
  };
}
