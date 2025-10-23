"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useCallback } from "react";
import { toast } from "sonner";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useTRPC } from "@/services/trpc/react";
import { getNewLastPosition } from "../utils";
import { useMapQuery } from "./useMapQuery";
import type { Folder } from "@/server/models/Folder";

export function useFoldersQuery() {
  const { mapId } = use(MapContext);
  const { data: mapData, isFetching } = useMapQuery(mapId);
  return { data: mapData?.folders, isFetching };
}

export function useFolderMutations() {
  const { mapId } = use(MapContext);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: deleteFolderMutation } = useMutation(
    trpc.folder.delete.mutationOptions({
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
        toast.error("Failed to delete folder");
      },
    }),
  );

  const { mutate: upsertFolderMutation, isPending: upsertLoading } =
    useMutation(
      trpc.folder.upsert.mutationOptions({
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
          toast.error("Failed to save folder");
        },
      }),
    );

  const deleteFolder = useCallback(
    (id: string) => {
      if (!mapId) return;

      // Optimistic update: remove from cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          folders: old.folders?.filter((f) => f.id !== id) || [],
        };
      });

      deleteFolderMutation({ folderId: id, mapId });
    },
    [mapId, queryClient, trpc.map.byId, deleteFolderMutation],
  );

  const insertFolder = useCallback(
    (newFolder: Omit<Folder, "position" | "mapId">) => {
      if (!mapId) return;

      // Get current folders for position calculation
      const mapData = queryClient.getQueryData(
        trpc.map.byId.queryKey({ mapId }),
      );
      const currentFolders = mapData?.folders || [];

      const newPosition = getNewLastPosition(currentFolders);
      // Optimistic update: add to cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          folders: [
            ...(old.folders || []),
            {
              ...newFolder,
              hideMarkers: newFolder.hideMarkers ?? false,
              position: newPosition,
              mapId,
            },
          ],
        };
      });

      upsertFolderMutation({ ...newFolder, position: newPosition, mapId });
    },
    [mapId, queryClient, trpc.map.byId, upsertFolderMutation],
  );

  const updateFolder = useCallback(
    (folder: Omit<Folder, "mapId">) => {
      if (!mapId) return;

      // Optimistic update: update in cache immediately
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          folders:
            old.folders?.map((f) =>
              f.id === folder.id
                ? { ...folder, hideMarkers: folder.hideMarkers ?? false, mapId }
                : f,
            ) || [],
        };
      });

      upsertFolderMutation({ ...folder, mapId });
    },
    [mapId, queryClient, trpc.map.byId, upsertFolderMutation],
  );

  return {
    deleteFolder,
    insertFolder,
    updateFolder,
    loading: upsertLoading,
  };
}
