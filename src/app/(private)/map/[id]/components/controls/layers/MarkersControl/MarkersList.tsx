import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Database, Table } from "lucide-react";
import { useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { PlacedMarker } from "@/__generated__/types";
import DataSourceIcon from "@/app/(private)/map/[id]/components/DataSourceIcon";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import FolderItem from "./FolderItem";
import MarkerDragOverlay from "./MarkerDragOverlay";
import UnassignedFolder from "./UnassignedFolder";
import {
  compareByPositionAndId,
  getNewFirstPosition,
  getNewLastPosition,
  getNewPositionAfter,
  getNewPositionBefore,
} from "./utils";

export default function MarkersList() {
  const { viewConfig } = useContext(MapContext);
  const { folders, placedMarkers, updatePlacedMarker } =
    useContext(MarkerAndTurfContext);
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const { getMarkerDataSources } = useContext(DataSourcesContext);
  const markerDataSources = getMarkerDataSources();

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

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      // Early exit if marker is not over a different folder
      if (!over || active.id === over.id) {
        return;
      }

      // Handle moving into a different folder
      const activeMarkerId = active.id.toString().replace("marker-", "");
      const activeMarker = placedMarkers.find((m) => m.id === activeMarkerId);

      if (!activeMarker) {
        return;
      }

      if (over.id.toString().startsWith("folder")) {
        let folderId: string;

        // Handle both header and footer IDs
        let append = false;
        if (over.id.toString().startsWith("folder-footer-")) {
          folderId = over.id.toString().replace("folder-footer-", "");
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
          placedMarker: {
            ...activeMarker,
            folderId: folderId,
            position: newPosition,
          },
          temp: true,
        });
      } else if (over.id === "unassigned") {
        const unassignedMarkers = placedMarkers.filter(
          (m) => m.folderId === null,
        );
        const newPosition = getNewFirstPosition(unassignedMarkers);
        updatePlacedMarker({
          placedMarker: {
            ...activeMarker,
            folderId: null,
            position: newPosition,
          },
          temp: true,
        });
      }
    },
    [placedMarkers, updatePlacedMarker],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Update UI
      setActiveId(null);

      // Early exit if no action required
      if (!over || active.id === over.id) {
        return;
      }

      let activeMarker = null;
      if (active.id.toString().startsWith("marker-")) {
        const activeMarkerId = active.id.toString().replace("marker-", "");
        activeMarker = placedMarkers.find((m) => m.id === activeMarkerId);
      }

      // Animate movement
      if (activeMarker?.folderId) {
        setPulsingFolderId(activeMarker.folderId);
      }

      // Handle reordering within the same container
      // Simpler to do it here than in onDragOver, as the library
      // automatically handles re-ordering while drag is in progress
      if (activeMarker && over.id.toString().startsWith("marker-")) {
        const overMarkerId = over.id.toString().replace("marker-", "");
        const overMarker = placedMarkers.find((m) => m.id === overMarkerId);

        if (!activeMarker || !overMarker) {
          return;
        }

        let newPosition = 0;

        const wasBefore = compareByPositionAndId(activeMarker, overMarker) < 0;

        // Get other markers to position against
        const otherMarkers = placedMarkers.filter(
          (m) =>
            m.id !== activeMarker.id && m.folderId === activeMarker.folderId,
        );

        if (wasBefore) {
          // If active marker was before, make it after
          newPosition = getNewPositionAfter(overMarker.position, otherMarkers);
        } else {
          // If active marker was after, make it before
          newPosition = getNewPositionBefore(overMarker.position, otherMarkers);
        }

        updatePlacedMarker({
          placedMarker: { ...activeMarker, position: newPosition },
        });

        return;
      }

      // Persist folder movement to database
      // (folderId is already set in handleDragOver)
      if (
        active.id.toString().startsWith("marker-") &&
        over.id.toString().startsWith("folder-")
      ) {
        const activeMarkerId = active.id.toString().replace("marker-", "");
        const activeMarker = placedMarkers.find((m) => m.id === activeMarkerId);

        if (activeMarker) {
          updatePlacedMarker({
            placedMarker: { ...activeMarker },
          });
        }

        return;
      }
    },
    [placedMarkers, setPulsingFolderId, updatePlacedMarker],
  );

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
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div
          className={`${viewConfig.showLocations ? "opacity-100" : "opacity-50"} `}
        >
          {/* Folders */}
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              markers={placedMarkers.filter((p) => p.folderId === folder.id)}
              activeId={activeId}
              setKeyboardCapture={setKeyboardCapture}
              isPulsing={pulsingFolderId === folder.id}
            />
          ))}

          {/* Unassigned markers */}
          <div>
            <UnassignedFolder
              markers={placedMarkers.filter((p) => !p.folderId)}
              activeId={activeId}
              folders={folders}
              setKeyboardCapture={setKeyboardCapture}
            />
          </div>

          {/* Data sources */}
          {markerDataSources.length > 0 && (
            <div className="gap-2 p-2 mt-3 bg-muted rounded">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Data sources
                </p>
              </div>

              <ul>
                {markerDataSources.map((dataSource) => (
                  <li key={dataSource.id} className="text-sm mt-2">
                    <div
                      className={`text-sm cursor-pointer rounded hover:bg-neutral-100 transition-colors flex items-center justify-between gap-2 ${
                        dataSource.id === selectedDataSourceId
                          ? "bg-neutral-100"
                          : ""
                      }`}
                      onClick={() => handleDataSourceSelect(dataSource.id)}
                    >
                      <div className="flex items-center gap-2">
                        <DataSourceIcon type={dataSource.config.type} />
                        {dataSource.name}
                      </div>
                      {dataSource.id === selectedDataSourceId && (
                        <Table className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeId && getActiveMarker() && (
              <MarkerDragOverlay marker={getActiveMarker() as PlacedMarker} />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}
