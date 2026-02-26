import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
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
import useSortableList from "../SortableList/hooks/useSortableList";
import SortableFolderItem from "../SortableList/SortableFolderItem";
import UnassignedFolder from "../SortableList/UnassignedFolder";
import MarkerDragOverlay from "./MarkerDragOverlay";
import type { DropdownMenuItemType } from "@/components/MultiDropdownMenu";

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

  const markerFolders = useMemo(() => {
    return folders.filter((f) => !f.type || f.type === "placedMarker");
  }, [folders]);

  const {
    activeId,
    setActiveId,
    sensors,
    setKeyboardCapture,
    handleDragOver,
    handleDragStart,
    handleDragEnd,
  } = useSortableList({
    folders: markerFolders,
  });

  const activeMarker = useMemo(
    () => placedMarkers.find((m) => `item-${m.id}` === activeId),
    [activeId, placedMarkers],
  );

  const sortedFolders = useMemo(() => {
    return sortByPositionAndId(markerFolders);
  }, [markerFolders]);

  const hasMarkers =
    membersDataSource ||
    markerDataSources?.length ||
    placedMarkers.length ||
    markerFolders.length;

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
                />
              ))}
            </SortableContext>
          </div>
          {/* Unassigned markers */}
          <div>
            <UnassignedFolder
              markers={placedMarkers.filter((p) => !p.folderId)}
              activeId={activeId}
              folders={markerFolders}
              setKeyboardCapture={setKeyboardCapture}
            />
          </div>
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeId && activeMarker && (
              <MarkerDragOverlay marker={activeMarker} />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}
