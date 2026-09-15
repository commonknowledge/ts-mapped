"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom, useAtomValue, useAtomValueRawSync, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { AreaSetGroupCode } from "@/models/AreaSet";
import { MapType, type MapViewConfig } from "@/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { dirtyViewIdsAtom, viewIdAtom } from "../atoms/mapStateAtoms";
import { createNewViewConfig } from "../utils/mapView";
import { getNewLastPosition } from "../utils/position";
import { useDebouncedCallback } from "./useDebouncedCallback";
import { useMapId } from "./useMapCore";
import { useIsReadOnlyRoute } from "./useMapEditable";
import { useMapQuery } from "./useMapQuery";
import type { View } from "../types";

export function useMapViews() {
  const viewId = useViewId();
  const mapId = useMapId();
  const setViewId = useSetViewId();
  const setDirtyViewIds = useSetDirtyViewIds();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: mapData } = useMapQuery(mapId);
  // On the read-only shared map page, view-config changes (map style,
  // timeline range) update the query cache for instant feedback but are
  // never persisted — anonymous viewers cannot write, and their tweaks
  // should reset on reload.
  const isReadOnlyRoute = useIsReadOnlyRoute();

  // Get views directly from cache
  const views = mapData?.views;

  // Fall back to the first view during render rather than waiting for
  // useInitialMapViewEffect to write viewIdAtom, so components that mount in
  // the same commit as the map data never render with an empty view config.
  const view = useMemo(
    () => views?.find((v) => v.id === viewId) || views?.[0] || null,
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
      if (!mapId || isReadOnlyRoute) return;

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
      isReadOnlyRoute,
      views,
      setViewId,
      setDirtyViewIds,
      queryClient,
      trpc.map.byId,
      insertViewMutate,
    ],
  );

  const { mutate: updateViewMutateRaw } = useMutation(
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

  const updateViewMutate = useDebouncedCallback(updateViewMutateRaw, 600);

  const updateView = useCallback(
    (view: View) => {
      if (!mapId) return;

      const updatedViews =
        views?.map((v) => (v.id === view.id ? view : v)) || [];

      if (!isReadOnlyRoute) {
        setDirtyViewIds((ids) => ids.concat([view.id]));
      }

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

      if (!isReadOnlyRoute) {
        updateViewMutate({ mapId, views: updatedViews });
      }
    },
    [
      mapId,
      isReadOnlyRoute,
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

      // Re-display choropleth when the user selects a visualisation
      if (viewConfig.areaDataColumn) {
        viewConfig.showChoropleth = true;
      }

      // Clear the selected columns when the user changes the data source
      if (viewConfig.areaDataSourceId) {
        if (!viewConfig.areaDataColumn) {
          viewConfig.areaDataColumn = "";
        }
        // Don't automatically set areaDataSecondaryColumn - let it be explicitly managed
        // Only clear it if explicitly set to undefined in the update
      }

      // Set boundaries if the view is a hex map and no boundaries are set
      if (
        viewConfig.mapType === MapType.Hex &&
        !viewConfig.areaSetGroupCode &&
        !view.config.areaSetGroupCode
      ) {
        viewConfig.areaSetGroupCode = AreaSetGroupCode.WMC24;
      }

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
      if (!mapId || isReadOnlyRoute) return;

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
    [mapId, isReadOnlyRoute, queryClient, trpc.map.byId, deleteViewMutate],
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

/**
 * Hook for managing map view state
 * Includes currently selected viewId and dirty tracking for unsaved changes
 */
// Route-level atoms (map ID, view ID, map mode) are written during mount: by
// MapJotaiProvider's hydration and by effects such as useInitialMapViewEffect.
// jotai 3's `useAtomValue` no longer re-renders once after subscribing, so a
// component that rendered before such a write and subscribed after it would
// keep the stale value until the atom next changed (see "A subtle mount-timing
// change in v3" in the jotai docs). `useAtomValueRawSync` is built on
// useSyncExternalStore and always picks up writes made during mount. Only use
// it for atoms that are written while readers are mounting; everything else
// stays on `useAtomValue`.
export function useMapViewState() {
  const viewId = useAtomValueRawSync(viewIdAtom);
  const setViewId = useSetAtom(viewIdAtom);
  const dirtyViewIds = useAtomValue(dirtyViewIdsAtom);
  const setDirtyViewIds = useSetAtom(dirtyViewIdsAtom);

  return {
    viewId,
    setViewId,
    dirtyViewIds,
    setDirtyViewIds,
  };
}

// Individual hooks for granular access
export function useViewId() {
  return useAtomValueRawSync(viewIdAtom);
}

export function useViewIdAtom(): [
  string | null,
  (viewId: string | null) => void,
] {
  return [useAtomValueRawSync(viewIdAtom), useSetAtom(viewIdAtom)];
}

export function useSetViewId() {
  return useSetAtom(viewIdAtom);
}

export function useDirtyViewIds() {
  return useAtomValue(dirtyViewIdsAtom);
}

export function useDirtyViewIdsAtom() {
  return useAtom(dirtyViewIdsAtom);
}

export function useSetDirtyViewIds() {
  return useSetAtom(dirtyViewIdsAtom);
}
