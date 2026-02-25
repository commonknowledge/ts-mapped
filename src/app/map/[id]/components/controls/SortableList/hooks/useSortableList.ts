import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useFolderMutations } from "@/app/map/[id]/hooks/useFolders";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapId } from "@/app/map/[id]/hooks/useMapCore";
import { usePlacedMarkerMutations } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { useTurfMutations } from "@/app/map/[id]/hooks/useTurfMutations";
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
import type { Turf } from "@/server/models/Turf";

interface DraggableItem {
  id: string;
  folderId?: string | null | undefined;
  position: number;
}

interface DragHandlerDeps {
  folders: Folder[];
}

function useSortableList({ folders }: DragHandlerDeps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const mapId = useMapId();
  const { updatePlacedMarker } = usePlacedMarkerMutations();
  const { updateTurf } = useTurfMutations();
  const { updateFolder } = useFolderMutations();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [keyboardCapture, setKeyboardCapture] = useState(false);

  const currentCacheData = mapId
    ? queryClient.getQueryData(trpc.map.byId.queryKey({ mapId }))
    : null;

  const currentMarkers = useMemo(
    () => currentCacheData?.placedMarkers || [],
    [currentCacheData?.placedMarkers],
  );
  const currentTurfs = useMemo(
    () => currentCacheData?.turfs || [],
    [currentCacheData?.turfs],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Disable keyboard while text input is active
      keyboardCodes: keyboardCapture
        ? { start: [], cancel: [], end: [] }
        : undefined,
    }),
  );

  const findItem = useCallback(
    (id: string) => {
      return (
        currentMarkers.find((m) => m.id === id) ??
        currentTurfs.find((t) => t.id === id)
      );
    },
    [currentMarkers, currentTurfs],
  );

  const findOtherItemsInFolder = useCallback(
    (excludeId: string, folderId: string | null | undefined) => {
      const otherItems: DraggableItem[] = currentMarkers.filter(
        (m) => m.id !== excludeId && m.folderId === folderId,
      );
      return otherItems.concat(
        currentTurfs.filter(
          (t) => t.id !== excludeId && t.folderId === folderId,
        ),
      );
    },
    [currentMarkers, currentTurfs],
  );

  const updateItem = useCallback(
    (item: PlacedMarker | Turf) => {
      if ("polygon" in item) {
        updateTurf(item);
        return;
      }
      updatePlacedMarker(item);

      if (item.folderId) {
        const folderColor =
          mapConfig.folderColors?.[item.folderId] || mapColors.markers.color;
        updateMapConfig({
          placedMarkerColors: {
            ...(mapConfig.placedMarkerColors ?? {}),
            [item.id]: folderColor,
          },
        });
      }
    },
    [
      mapConfig.folderColors,
      mapConfig.placedMarkerColors,
      updateMapConfig,
      updatePlacedMarker,
      updateTurf,
    ],
  );

  // Update cache only (for optimistic updates during drag) - NO mutation
  const updateItemInCache = useCallback(
    (item: Omit<PlacedMarker, "mapId"> | Omit<Turf, "mapId">) => {
      if (!mapId) return;

      if ("polygon" in item) {
        const fullTurf = {
          ...item,
          mapId,
          color: item.color ?? null,
          folderId: item.folderId ?? null,
        };
        queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
          if (!old) return old;
          return {
            ...old,
            turfs:
              old.turfs?.map((m) => (m.id === fullTurf.id ? fullTurf : m)) ||
              [],
          };
        });
        return;
      }

      const fullMarker = {
        ...item,
        mapId,
        folderId: item.folderId ?? null,
      };

      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          placedMarkers:
            old.placedMarkers?.map((m) =>
              m.id === fullMarker.id ? fullMarker : m,
            ) || [],
        };
      });
    },
    [mapId, queryClient, trpc.map.byId],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      if (!mapId) return;

      const activeItemId = active.id.toString().replace("item-", "");
      const activeItem = findItem(activeItemId);

      if (!activeItem) {
        return;
      }

      if (over.id.toString().startsWith("item-")) {
        const overItemId = over.id.toString().replace("item-", "");
        const overItem = findItem(overItemId);

        if (overItem && overItem.folderId !== activeItem.folderId) {
          const activeWasBeforeOver =
            compareByPositionAndId(activeItem, overItem) < 0;

          const otherMarkers = findOtherItemsInFolder(
            activeItem.id,
            overItem.folderId,
          );

          const newPosition = activeWasBeforeOver
            ? getNewPositionAfter(overItem.position, otherMarkers)
            : getNewPositionBefore(overItem.position, otherMarkers);

          updateItemInCache({
            ...activeItem,
            folderId: overItem.folderId,
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

        const folderMarkers = findOtherItemsInFolder(activeItem.id, folderId);

        const newPosition = append
          ? getNewLastPosition(folderMarkers)
          : getNewFirstPosition(folderMarkers);

        updateItemInCache({
          ...activeItem,
          folderId,
          position: newPosition,
        });
      } else if (over.id === "unassigned") {
        if (activeItem.folderId !== null) {
          const unassignedMarkers = findOtherItemsInFolder(activeItem.id, null);
          const newPosition = getNewFirstPosition(unassignedMarkers);

          updateItemInCache({
            ...activeItem,
            folderId: null,
            position: newPosition,
          });
        }
      }
    },
    [findItem, findOtherItemsInFolder, mapId, updateItemInCache],
  );

  const handleDragEndItem = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      const activeItemId = active.id.toString().replace("item-", "");
      const activeItem = findItem(activeItemId);

      if (!activeItem) {
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

        const folderMarkers = findOtherItemsInFolder(activeItemId, folderId);

        const newPosition = append
          ? getNewLastPosition(folderMarkers)
          : getNewFirstPosition(folderMarkers);

        updateItem({
          ...activeItem,
          folderId,
          position: newPosition,
        });
      } else if (over && over.id === "unassigned") {
        const unassignedItems = findOtherItemsInFolder(activeItem.id, null);
        const newPosition = getNewFirstPosition(unassignedItems);
        updateItem({
          ...activeItem,
          folderId: null,
          position: newPosition,
        });
      } else if (over && over.id.toString().startsWith("item-")) {
        const overItemId = over.id.toString().replace("item-", "");
        const overItem = findItem(overItemId);

        if (overItem && activeItem.id !== overItem.id) {
          const activeWasBeforeOver =
            compareByPositionAndId(activeItem, overItem) < 0;

          const otherMarkers = findOtherItemsInFolder(
            activeItem.id,
            overItem.folderId,
          );

          const newPosition = activeWasBeforeOver
            ? getNewPositionAfter(overItem.position, otherMarkers)
            : getNewPositionBefore(overItem.position, otherMarkers);

          updateItem({
            ...activeItem,
            folderId: overItem.folderId,
            position: newPosition,
          });
        }
      }
    },
    [findItem, findOtherItemsInFolder, updateItem],
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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id.toString());
    },
    [setActiveId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active } = event;

      const activeIdStr = active.id.toString();
      if (activeIdStr.startsWith("item-")) {
        handleDragEndItem(event);
      } else if (activeIdStr.startsWith("folder-drag-")) {
        handleDragEndFolder(event);
      }

      // Update UI AFTER handling the drag
      setActiveId(null);
    },
    [handleDragEndFolder, handleDragEndItem, setActiveId],
  );

  return {
    activeId,
    setActiveId,
    keyboardCapture,
    setKeyboardCapture,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    sensors,
  };
}

export default useSortableList;
