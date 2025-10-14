"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  MapContext,
  createNewViewConfig,
} from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "../utils";
import { useMapQuery } from "./useMapQuery";
import type { View } from "../types";
import type { MapViewConfig } from "@/server/models/MapView";

export function useMapViews() {
  const { viewId, mapId, setViewId, setDirtyViewIds } = use(MapContext);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: mapData } = useMapQuery(mapId);

  // Get views directly from cache and ensure they have isTag field
  const views = useMemo(() => {
    const rawViews = mapData?.views || [];
    return rawViews.map((v) => ({
      ...v,
      isTag: v.isTag ?? false, // Ensure isTag is always a boolean
    }));
  }, [mapData?.views]);

  const view = useMemo(
    () => views.find((v) => v.id === viewId) || null,
    [viewId, views],
  );

  const viewConfig = useMemo(() => {
    return view?.config || createNewViewConfig();
  }, [view]);

  const { mutate: insertViewMutate } = useMutation(
    trpc.map.updateViews.mutationOptions({
      onMutate: async ({ views: newViews }) => {
        if (!mapId) return;

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.map.byId.queryKey({ mapId }),
        });

        // Snapshot previous value
        const previousData = queryClient.getQueryData(
          trpc.map.byId.queryKey({ mapId }),
        );

        // Optimistically update the cache
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

        return { previousData };
      },
      onError: (err, _variables, context) => {
        console.error("insertView mutation error:", err);
        // Rollback on error
        if (mapId && context?.previousData) {
          queryClient.setQueryData(
            trpc.map.byId.queryKey({ mapId }),
            context.previousData,
          );
        }
        toast.error(`Failed to create view: ${err.message || "Unknown error"}`);
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

      // Ensure all existing views have the isTag field
      const existingViews = (views || []).map((v) => ({
        ...v,
        isTag: v.isTag ?? false, // Default to false if undefined
      }));

      const newViews = [...existingViews, newView];

      setViewId(newView.id);

      setDirtyViewIds((ids) => ids.concat([newView.id]));

      insertViewMutate({
        mapId,
        views: newViews,
      });
    },
    [mapId, views, setViewId, setDirtyViewIds, insertViewMutate],
  );

  const { mutate: updateViewMutate } = useMutation(
    trpc.map.updateViews.mutationOptions({
      onMutate: async ({ views: updatedViews }) => {
        if (!mapId) return;

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.map.byId.queryKey({ mapId }),
        });

        // Snapshot previous value
        const previousData = queryClient.getQueryData(
          trpc.map.byId.queryKey({ mapId }),
        );

        // Optimistically update the cache
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

      // Ensure all views have the isTag field
      const updatedViews = views.map((v) => ({
        ...(v.id === view.id ? view : v),
        isTag: (v.id === view.id ? view.isTag : v.isTag) ?? false,
      }));

      setDirtyViewIds((ids) => ids.concat([view.id]));

      updateViewMutate({
        mapId,
        views: updatedViews,
      });
    },
    [mapId, setDirtyViewIds, updateViewMutate, views],
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
