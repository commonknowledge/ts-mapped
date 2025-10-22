import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useMarkerDataSources } from "@/app/map/[id]/hooks/useDataSources";
import {
  useFolderMutations,
  useFoldersQuery,
} from "@/app/map/[id]/hooks/useFolders";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import {
  usePlacedMarkerMutations,
  usePlacedMarkersQuery,
} from "@/app/map/[id]/hooks/usePlacedMarkers";
import {
  compareByPositionAndId,
  getNewFirstPosition,
  getNewLastPosition,
  getNewPositionAfter,
  getNewPositionBefore,
  sortByPositionAndId,
} from "@/app/map/[id]/utils";
import CollectionLayer from "../../CollectionLayer";
import EmptyLayer from "../../Emptylayer";
import FolderDragOverlay from "./FolderDragOverlay";
import MarkerDragOverlay from "./MarkerDragOverlay";
import SortableFolderItem from "./SortableFolderItem";
import UnassignedFolder from "./UnassignedFolder";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";

export default function MarkersList() {
  const { viewConfig } = useMapViews();
  const { data: folders = [] } = useFoldersQuery();
  const { updateFolder } = useFolderMutations();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { updatePlacedMarker } = usePlacedMarkerMutations();
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const markerDataSources = useMarkerDataSources();

  const [activeId, setActiveId] = useState<string | null>(null);

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
    }),
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // This function is now only used for visual feedback during drag
    // The actual mutations will happen in handleDragEnd
    const { active, over } = event;

    // Early exit if marker is not over a different folder
    if (!over || active.id === over.id) {
      return;
    }

    // We could add visual feedback here if needed
    // but no mutations should happen during drag
  }, []);

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
          (m) => m.folderId === folderId,
        );

        const newPosition = append
          ? getNewLastPosition(folderMarkers)
          : getNewFirstPosition(folderMarkers);

        updatePlacedMarker({
          ...activeMarker,
          folderId,
          position: newPosition,
        });

        // Animate movement - pulse the folder that received the marker
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
        });
      } else if (over && over.id.toString().startsWith("marker-")) {
        // Handle reordering within the same container
        const overMarkerId = over.id.toString().replace("marker-", "");
        const overMarker = placedMarkers.find((m) => m.id === overMarkerId);

        if (overMarker && activeMarker.id !== overMarker.id) {
          let newPosition = 0;

          const activeWasBeforeOver =
            compareByPositionAndId(activeMarker, overMarker) < 0;

          // Get other markers to position against
          const otherMarkers = placedMarkers.filter(
            (m) =>
              m.id !== activeMarker.id && m.folderId === activeMarker.folderId,
          );

          if (activeWasBeforeOver) {
            // If active marker was before, make it after
            newPosition = getNewPositionAfter(
              overMarker.position,
              otherMarkers,
            );
          } else {
            // If active marker was after, make it before
            newPosition = getNewPositionBefore(
              overMarker.position,
              otherMarkers,
            );
          }

          updatePlacedMarker({
            ...activeMarker,
            position: newPosition,
          });
        }
      }
    },
    [placedMarkers, updatePlacedMarker, setPulsingFolderId],
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
              otherFolders,
            );
          } else {
            // If active folder was after, make it before
            newPosition = getNewPositionBefore(
              overFolder.position,
              otherFolders,
            );
          }

          updateFolder({ ...activeFolder, position: newPosition });
        }
      }
    },
    [folders, updateFolder],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active } = event;

      // Update UI
      setActiveId(null);

      const activeId = active.id.toString();
      if (activeId.startsWith("marker-")) {
        handleDragEndMarker(event);
      } else if (activeId.startsWith("folder-drag-")) {
        handleDragEndFolder(event);
      }
    },
    [handleDragEndFolder, handleDragEndMarker],
  );

  const sortedFolders = useMemo(() => {
    return sortByPositionAndId(folders);
  }, [folders]);

  const activeMarker = useMemo(() => {
    if (!activeId) return null;
    const markerId = activeId.replace("marker-", "");
    return placedMarkers.find((marker) => marker.id === markerId) || null;
  }, [activeId, placedMarkers]);

  const activeFolder = useMemo(() => {
    if (!activeId) return null;
    const folderId = activeId.replace("folder-drag-", "");
    return folders.find((folder) => folder.id === folderId) || null;
  }, [activeId, folders]);

  return (
    <div className="relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        modifiers={[restrictToVerticalAxis]}
      >
        <div
          className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"} `}
        >
          <ol>
            {markerDataSources &&
              markerDataSources.length === 0 &&
              placedMarkers.length === 0 && (
                <EmptyLayer message="Add a Marker Layer" />
              )}
            {/* Data sources */}
            {markerDataSources && markerDataSources.length > 0 && (
              <ul>
                {markerDataSources.map((dataSource) => (
                  <li key={dataSource.id} className="mb-2">
                    <CollectionLayer
                      dataSource={dataSource}
                      isSelected={dataSource.id === selectedDataSourceId}
                      onClick={() => handleDataSourceSelect(dataSource.id)}
                      handleDataSourceSelect={handleDataSourceSelect}
                      layerType="marker"
                    />
                  </li>
                ))}
              </ul>
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
                    (p) => p.folderId === folder.id,
                  )}
                  activeId={activeId}
                  setKeyboardCapture={setKeyboardCapture}
                  isPulsing={pulsingFolderId === folder.id}
                />
              ))}
            </SortableContext>
          </ol>
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
            {activeMarker && <MarkerDragOverlay marker={activeMarker} />}
            {activeFolder && <FolderDragOverlay folder={activeFolder} />}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}
