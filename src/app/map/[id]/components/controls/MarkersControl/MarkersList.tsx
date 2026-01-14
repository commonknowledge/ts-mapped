import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  useMarkerDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import {
  useFolderMutations,
  useFoldersQuery,
} from "@/app/map/[id]/hooks/useFolders";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import {
  usePlacedMarkerMutations,
  usePlacedMarkersQuery,
} from "@/app/map/[id]/hooks/usePlacedMarkers";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import {
  compareByPositionAndId,
  getNewFirstPosition,
  getNewLastPosition,
  getNewPositionAfter,
  getNewPositionBefore,
  sortByPositionAndId,
} from "@/app/map/[id]/utils";
import { useTRPC } from "@/services/trpc/react";
import { LayerType } from "@/types";
import { useMapId } from "../../../hooks/useMapCore";
import { mapColors } from "../../../styles";
import DataSourceControl from "../DataSourceItem";
import EmptyLayer from "../LayerEmptyMessage";
import MarkerDragOverlay from "./MarkerDragOverlay";
import SortableFolderItem from "./SortableFolderItem";
import UnassignedFolder from "./UnassignedFolder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";

export default function MarkersList() {
  const mapId = useMapId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { viewConfig } = useMapViews();
  const { data: folders = [] } = useFoldersQuery();
  const { updateFolder } = useFolderMutations();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { updatePlacedMarker } = usePlacedMarkerMutations();
  const { selectedDataSourceId, handleDataSourceSelect } = useTable();
  const markerDataSources = useMarkerDataSources();
  const membersDataSource = useMembersDataSource();

  const [activeId, setActiveId] = useState<string | null>(null);

  // Track folder colors - map of folderId -> color
  const [folderColors, setFolderColors] = useState<Record<string, string>>({});

  // Brief pulsing folder animation on some drag actions
  const [pulsingFolderId, _setPulsingFolderId] = useState<string | null>(null);

  const setPulsingFolderId = useCallback((id: string | null) => {
    _setPulsingFolderId(id);
    setTimeout(() => {
      _setPulsingFolderId(null);
    }, 600);
  }, []);

  // Keep track of if a text input is active to disable keyboard dragging
  const [keyboardCapture, setKeyboardCapture] = useState(false);

  // Update cache only (for optimistic updates during drag) - NO mutation
  const updateMarkerInCache = useCallback(
    (placedMarker: Omit<PlacedMarker, "mapId">) => {
      if (!mapId) return;

      const fullMarker = {
        ...placedMarker,
        mapId,
        folderId: placedMarker.folderId ?? null,
      };

      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return {
          ...old,
          placedMarkers:
            old.placedMarkers?.map((m) =>
              m.id === placedMarker.id ? fullMarker : m
            ) || [],
        };
      });
    },
    [mapId, queryClient, trpc.map.byId]
  );

  // DnD sensors
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
    })
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      // Early exit if marker is not over anything or over itself
      if (!over || active.id === over.id) {
        return;
      }

      if (!mapId) return;

      // Handle moving into a different folder - CACHE UPDATE ONLY (no mutation)
      const activeMarkerId = active.id.toString().replace("marker-", "");

      // Get current cache data (reflects any previous drag over updates)
      const currentCacheData = queryClient.getQueryData(
        trpc.map.byId.queryKey({ mapId })
      );
      const currentMarkers = currentCacheData?.placedMarkers || [];

      const activeMarker = currentMarkers.find((m) => m.id === activeMarkerId);

      if (!activeMarker) {
        return;
      }

      // Check if we're over another marker
      if (over.id.toString().startsWith("marker-")) {
        const overMarkerId = over.id.toString().replace("marker-", "");
        const overMarker = currentMarkers.find((m) => m.id === overMarkerId);

        // If we're over a marker in a DIFFERENT container, move to that container
        if (overMarker && overMarker.folderId !== activeMarker.folderId) {
          const activeWasBeforeOver =
            compareByPositionAndId(activeMarker, overMarker) < 0;

          // Get other markers in the target container
          const otherMarkers = currentMarkers.filter(
            (m) =>
              m.id !== activeMarker.id && m.folderId === overMarker.folderId
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

        // Handle header, footer, and draggable folder element IDs
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
          (m) => m.folderId === folderId
        );

        const newPosition = append
          ? getNewLastPosition(folderMarkers)
          : getNewFirstPosition(folderMarkers);

        // Update CACHE only - no mutation sent to server
        updateMarkerInCache({
          ...activeMarker,
          folderId,
          position: newPosition,
        });
      } else if (over.id === "unassigned") {
        // Only update cache if the marker is not already unassigned
        if (activeMarker.folderId !== null) {
          const unassignedMarkers = currentMarkers.filter(
            (m) => m.folderId === null
          );
          const newPosition = getNewFirstPosition(unassignedMarkers);

          // Update CACHE only - no mutation sent to server
          updateMarkerInCache({
            ...activeMarker,
            folderId: null,
            position: newPosition,
          });
        }
      }
    },
    [mapId, queryClient, trpc.map.byId, updateMarkerInCache]
  );

  const handleDragEndMarker = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      const activeMarkerId = active.id.toString().replace("marker-", "");
      const activeMarker = placedMarkers.find((m) => m.id === activeMarkerId);

      if (!activeMarker) {
        return;
      }

      // Handle moving into a different folder
      if (over && over.id.toString().startsWith("folder")) {
        let folderId: string;

        // Handle header, footer, and draggable folder element IDs
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
          (m) => m.folderId === folderId
        );

        const newPosition = append
          ? getNewLastPosition(folderMarkers)
          : getNewFirstPosition(folderMarkers);

        // Get the folder's color
        const folderColor = folderColors[folderId] || mapColors.markers.color;

        updatePlacedMarker({
          ...activeMarker,
          folderId,
          position: newPosition,
        });

        // Update the marker's color in the UI by triggering a re-render
        // The color will be applied via the folderColor prop passed to SortableMarkerItem

        // Animate movement - pulse the folder that received the marker
        setPulsingFolderId(folderId);
      } else if (over && over.id === "unassigned") {
        const unassignedMarkers = placedMarkers.filter(
          (m) => m.folderId === null
        );
        const newPosition = getNewFirstPosition(unassignedMarkers);
        updatePlacedMarker({
          ...activeMarker,
          folderId: null,
          position: newPosition,
        });
      } else if (over && over.id.toString().startsWith("marker-")) {
        // Handle reordering within the same container OR moving to a different container
        const overMarkerId = over.id.toString().replace("marker-", "");
        const overMarker = placedMarkers.find((m) => m.id === overMarkerId);

        if (overMarker && activeMarker.id !== overMarker.id) {
          let newPosition = 0;

          const activeWasBeforeOver =
            compareByPositionAndId(activeMarker, overMarker) < 0;

          // Get other markers in the SAME container as the over marker
          const otherMarkers = placedMarkers.filter(
            (m) =>
              m.id !== activeMarker.id && m.folderId === overMarker.folderId
          );

          if (activeWasBeforeOver) {
            // If active marker was before, make it after
            newPosition = getNewPositionAfter(
              overMarker.position,
              otherMarkers
            );
          } else {
            // If active marker was after, make it before
            newPosition = getNewPositionBefore(
              overMarker.position,
              otherMarkers
            );
          }

          updatePlacedMarker({
            ...activeMarker,
            folderId: overMarker.folderId, // Move to the same folder as the marker we're dropping on
            position: newPosition,
          });

          // The marker's color will be updated via the folderColor prop passed to SortableMarkerItem
        }
      }
    },
    [placedMarkers, updatePlacedMarker, setPulsingFolderId]
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
          let newPosition = 0;

          const activeWasBeforeOver =
            compareByPositionAndId(activeFolder, overFolder) < 0;

          // Get other folders to position against
          const otherFolders = folders.filter((m) => m.id !== activeFolder.id);

          if (activeWasBeforeOver) {
            // If active folder was before, make it after
            newPosition = getNewPositionAfter(
              overFolder.position,
              otherFolders
            );
          } else {
            // If active folder was after, make it before
            newPosition = getNewPositionBefore(
              overFolder.position,
              otherFolders
            );
          }

          updateFolder({ ...activeFolder, position: newPosition });
        }
      }
    },
    [folders, updateFolder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active } = event;

      const activeId = active.id.toString();
      if (activeId.startsWith("marker-")) {
        handleDragEndMarker(event);
      } else if (activeId.startsWith("folder-drag-")) {
        handleDragEndFolder(event);
      }

      // Update UI AFTER handling the drag
      setActiveId(null);
    },
    [handleDragEndFolder, handleDragEndMarker]
  );

  const sortedFolders = useMemo(() => {
    return sortByPositionAndId(folders);
  }, [folders]);

  // Get active marker for drag overlay
  const getActiveMarker = () => {
    if (!activeId) return null;
    const markerId = activeId.replace("marker-", "");
    return placedMarkers.find((marker) => marker.id === markerId) || null;
  };

  return (
    <div className="relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        modifiers={[restrictToVerticalAxis]}
      >
        <div
          className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"} `}
        >
          <div className="flex flex-col gap-1">
            {!membersDataSource &&
              markerDataSources &&
              markerDataSources.length === 0 &&
              placedMarkers.length === 0 && (
                <EmptyLayer message="Add a Marker Layer" />
              )}

            {/* Member data source */}
            {membersDataSource && (
              <div className="flex flex-col gap-1">
                <DataSourceControl
                  key={membersDataSource.id}
                  dataSource={membersDataSource}
                  isSelected={membersDataSource.id === selectedDataSourceId}
                  handleDataSourceSelect={handleDataSourceSelect}
                  layerType={LayerType.Member}
                />
              </div>
            )}

            {/* Marker data sources */}
            {markerDataSources && markerDataSources.length > 0 && (
              <div className="flex flex-col gap-1">
                {markerDataSources.map((dataSource) => (
                  <DataSourceControl
                    key={dataSource.id}
                    dataSource={dataSource}
                    isSelected={dataSource.id === selectedDataSourceId}
                    handleDataSourceSelect={handleDataSourceSelect}
                    layerType={LayerType.Marker}
                  />
                ))}
              </div>
            )}

            {/* Folders */}
            <SortableContext
              items={sortedFolders.map((f) => `folder-drag-${f.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {sortedFolders.map((folder) => (
                <SortableFolderItem
                  key={folder.id}
                  folder={folder}
                  markers={placedMarkers.filter(
                    (p) => p.folderId === folder.id
                  )}
                  activeId={activeId}
                  setKeyboardCapture={setKeyboardCapture}
                  isPulsing={pulsingFolderId === folder.id}
                  folderColor={folderColors[folder.id]}
                  onFolderColorChange={(color) =>
                    setFolderColors((prev) => ({ ...prev, [folder.id]: color }))
                  }
                />
              ))}
            </SortableContext>
          </div>
          {/* Unassigned markers */}
          <div>
            <UnassignedFolder
              markers={placedMarkers.filter((p) => !p.folderId)}
              activeId={activeId}
              folders={folders}
              setKeyboardCapture={setKeyboardCapture}
            />
          </div>
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeId && getActiveMarker() && (
              <MarkerDragOverlay marker={getActiveMarker() as PlacedMarker} />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}
