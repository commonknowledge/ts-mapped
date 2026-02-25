import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useFolderMutations } from "@/app/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { usePlacedMarkerMutations } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { mapColors } from "@/app/map/[id]/styles";
import {
  compareByPositionAndId,
  getNewFirstPosition,
  getNewLastPosition,
  getNewPositionAfter,
  getNewPositionBefore,
} from "@/app/map/[id]/utils/position";
import { useTRPC } from "@/services/trpc/react";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";

interface DragHandlerDeps {
  placedMarkers: PlacedMarker[];
  folders: Folder[];
  updateMarkerInCache: (marker: Omit<PlacedMarker, "mapId">) => void;
  setPulsingFolderId: (id: string | null) => void;
}

export function useDragHandlers({
  placedMarkers,
  folders,
  updateMarkerInCache,
  setPulsingFolderId,
}: DragHandlerDeps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const mapId = useMapId();
  const { updatePlacedMarker } = usePlacedMarkerMutations();
  const { updateFolder } = useFolderMutations();
  const { mapConfig, updateMapConfig } = useMapConfig();

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      if (!mapId) return;

      const activeMarkerId = active.id.toString().replace("marker-", "");
      const currentCacheData = queryClient.getQueryData(
        trpc.map.byId.queryKey({ mapId }),
      );
      const currentMarkers = currentCacheData?.placedMarkers || [];
      const activeMarker = currentMarkers.find((m) => m.id === activeMarkerId);

      if (!activeMarker) {
        return;
      }

      if (over.id.toString().startsWith("marker-")) {
        const overMarkerId = over.id.toString().replace("marker-", "");
        const overMarker = currentMarkers.find((m) => m.id === overMarkerId);

        if (overMarker && overMarker.folderId !== activeMarker.folderId) {
          const activeWasBeforeOver =
            compareByPositionAndId(activeMarker, overMarker) < 0;

          const otherMarkers = currentMarkers.filter(
            (m) =>
              m.id !== activeMarker.id && m.folderId === overMarker.folderId,
          );

          const newPosition = activeWasBeforeOver
            ? getNewPositionAfter(overMarker.position, otherMarkers)
            : getNewPositionBefore(overMarker.position, otherMarkers);

          updateMarkerInCache({
            ...activeMarker,
            folderId: overMarker.folderId,
            position: newPosition,
          });
        }
        return;
      }

      if (over.id.toString().startsWith("folder")) {
        let folderId: string;
        let append = false;

        if (over.id.toString().startsWith("folder-footer-")) {
          folderId = over.id.toString().replace("folder-footer-", "");
          append = true;
        } else if (over.id.toString().startsWith("folder-drag-")) {
          folderId = over.id.toString().replace("folder-drag-", "");
          append = true;
        } else {
          folderId = over.id.toString().replace("folder-", "");
        }

        const folderMarkers = currentMarkers.filter(
          (m) => m.folderId === folderId,
        );

        const newPosition = append
          ? getNewLastPosition(folderMarkers)
          : getNewFirstPosition(folderMarkers);

        updateMarkerInCache({
          ...activeMarker,
          folderId,
          position: newPosition,
        });
      } else if (over.id === "unassigned") {
        if (activeMarker.folderId !== null) {
          const unassignedMarkers = currentMarkers.filter(
            (m) => m.folderId === null,
          );
          const newPosition = getNewFirstPosition(unassignedMarkers);

          updateMarkerInCache({
            ...activeMarker,
            folderId: null,
            position: newPosition,
          });
        }
      }
    },
    [mapId, queryClient, trpc.map.byId, updateMarkerInCache],
  );

  const handleDragEndMarker = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      const activeMarkerId = active.id.toString().replace("marker-", "");
      const activeMarker = placedMarkers.find((m) => m.id === activeMarkerId);

      if (!activeMarker) {
        return;
      }

      if (over && over.id.toString().startsWith("folder")) {
        let folderId: string;
        let append = false;

        if (over.id.toString().startsWith("folder-footer-")) {
          folderId = over.id.toString().replace("folder-footer-", "");
          append = true;
        } else if (over.id.toString().startsWith("folder-drag-")) {
          folderId = over.id.toString().replace("folder-drag-", "");
          append = true;
        } else {
          folderId = over.id.toString().replace("folder-", "");
        }

        const folderMarkers = placedMarkers.filter(
          (m) => m.folderId === folderId,
        );

        const newPosition = append
          ? getNewLastPosition(folderMarkers)
          : getNewFirstPosition(folderMarkers);

        updatePlacedMarker({
          ...activeMarker,
          folderId,
          position: newPosition,
        } as PlacedMarker);

        const folderColor =
          mapConfig.folderColors?.[folderId] || mapColors.markers.color;
        updateMapConfig({
          placedMarkerColors: {
            ...(mapConfig.placedMarkerColors ?? {}),
            [activeMarker.id]: folderColor,
          },
        });

        setPulsingFolderId(folderId);
      } else if (over && over.id === "unassigned") {
        const unassignedMarkers = placedMarkers.filter(
          (m) => m.folderId === null,
        );
        const newPosition = getNewFirstPosition(unassignedMarkers);
        updatePlacedMarker({
          ...activeMarker,
          folderId: null,
          position: newPosition,
        } as PlacedMarker);
      } else if (over && over.id.toString().startsWith("marker-")) {
        const overMarkerId = over.id.toString().replace("marker-", "");
        const overMarker = placedMarkers.find((m) => m.id === overMarkerId);

        if (overMarker && activeMarker.id !== overMarker.id) {
          const activeWasBeforeOver =
            compareByPositionAndId(activeMarker, overMarker) < 0;

          const otherMarkers = placedMarkers.filter(
            (m) =>
              m.id !== activeMarker.id && m.folderId === overMarker.folderId,
          );

          const newPosition = activeWasBeforeOver
            ? getNewPositionAfter(overMarker.position, otherMarkers)
            : getNewPositionBefore(overMarker.position, otherMarkers);

          updatePlacedMarker({
            ...activeMarker,
            folderId: overMarker.folderId,
            position: newPosition,
          } as PlacedMarker);

          if (overMarker.folderId) {
            const folderColor =
              mapConfig.folderColors?.[overMarker.folderId] ||
              mapColors.markers.color;
            updateMapConfig({
              placedMarkerColors: {
                ...mapConfig.placedMarkerColors,
                [activeMarker.id]: folderColor,
              },
            });
          }
        }
      }
    },
    [
      placedMarkers,
      updatePlacedMarker,
      setPulsingFolderId,
      mapConfig,
      updateMapConfig,
    ],
  );

  const handleDragEndFolder = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      const activeFolderId = active.id.toString().replace("folder-drag-", "");
      const activeFolder = folders.find((m) => m.id === activeFolderId);

      if (!activeFolder) {
        return;
      }

      if (over && over.id.toString().startsWith("folder-drag-")) {
        const overFolderId = over.id.toString().replace("folder-drag-", "");
        const overFolder = folders.find((m) => m.id === overFolderId);

        if (overFolder && activeFolder.id !== overFolder.id) {
          const activeWasBeforeOver =
            compareByPositionAndId(activeFolder, overFolder) < 0;

          const otherFolders = folders.filter((m) => m.id !== activeFolder.id);

          const newPosition = activeWasBeforeOver
            ? getNewPositionAfter(overFolder.position, otherFolders)
            : getNewPositionBefore(overFolder.position, otherFolders);

          updateFolder({ ...activeFolder, position: newPosition });
        }
      }
    },
    [folders, updateFolder],
  );

  return {
    handleDragOver,
    handleDragEndMarker,
    handleDragEndFolder,
  };
}
