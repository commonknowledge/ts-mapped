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
import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  useMarkerDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useFoldersQuery } from "@/app/map/[id]/hooks/useFolders";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import { sortByPositionAndId } from "@/app/map/[id]/utils/position";
import { LayerType } from "@/types";
import DataSourceControl from "../DataSourceItem";
import EmptyLayer from "../LayerEmptyMessage";
import MarkerDragOverlay from "../MarkersControl/MarkerDragOverlay";
import SortableFolderItem from "../MarkersControl/SortableFolderItem";
import UnassignedFolder from "../MarkersControl/UnassignedFolder";
import { useDragHandlers } from "./useDragHandlers";
import { useMarkerListState } from "./useMarkerListState";
import type { DropdownMenuItemType } from "@/components/MultiDropdownMenu";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

export default function MarkersList({
  dropdownItems,
}: {
  dropdownItems?: DropdownMenuItemType[];
}) {
  const { viewConfig } = useMapViews();
  const { data: folders = [] } = useFoldersQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { selectedDataSourceId, handleDataSourceSelect } = useTable();
  const markerDataSources = useMarkerDataSources();
  const membersDataSource = useMembersDataSource();

  const {
    activeId,
    setActiveId,
    pulsingFolderId,
    keyboardCapture,
    setKeyboardCapture,
    updateMarkerInCache,
    setPulsingFolderId,
    getActiveMarker,
    getActiveMarkerColor,
  } = useMarkerListState(placedMarkers);

  const { handleDragOver, handleDragEndMarker, handleDragEndFolder } =
    useDragHandlers({
      placedMarkers,
      folders,
      updateMarkerInCache,
      setPulsingFolderId,
    });

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
      if (activeIdStr.startsWith("marker-")) {
        handleDragEndMarker(event);
      } else if (activeIdStr.startsWith("folder-drag-")) {
        handleDragEndFolder(event);
      }

      // Update UI AFTER handling the drag
      setActiveId(null);
    },
    [handleDragEndFolder, handleDragEndMarker, setActiveId],
  );

  const sortedFolders = useMemo(() => {
    return sortByPositionAndId(folders);
  }, [folders]);

  const hasMarkers =
    membersDataSource ||
    markerDataSources?.length ||
    placedMarkers.length ||
    folders.length;

  return (
    <div className="relative pt-2">
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
            {!hasMarkers && (
              <EmptyLayer
                message="Add a Marker Layer"
                dropdownItems={dropdownItems}
              />
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
                    (p) => p.folderId === folder.id,
                  )}
                  activeId={activeId}
                  setKeyboardCapture={setKeyboardCapture}
                  isPulsing={pulsingFolderId === folder.id}
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
              <MarkerDragOverlay
                marker={getActiveMarker() as PlacedMarker}
                color={getActiveMarkerColor()}
              />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}
