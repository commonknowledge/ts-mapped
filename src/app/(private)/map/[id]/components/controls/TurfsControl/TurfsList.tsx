import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import { useFoldersQuery } from "@/app/(private)/map/[id]/hooks/useFolders";
import { useTurfsQuery } from "@/app/(private)/map/[id]/hooks/useTurfsQuery";
import { sortByPositionAndId } from "@/app/(private)/map/[id]/utils/position";
import EmptyLayer from "../LayerEmptyMessage";
import useSortableList from "../SortableList/hooks/useSortableList";
import SortableFolderItem from "../SortableList/SortableFolderItem";
import UnassignedFolder from "../SortableList/UnassignedFolder";
import TurfDragOverlay from "./TurfDragOverlay";

export default function TurfsList({ onAddArea }: { onAddArea: () => void }) {
  const { data: folders = [] } = useFoldersQuery();
  const { data: turfs = [] } = useTurfsQuery();

  const turfFolders = useMemo(() => {
    return folders.filter((f) => f.type === "turf");
  }, [folders]);

  const {
    activeId,
    setActiveId,
    sensors,
    setKeyboardCapture,
    handleDragOver,
    handleDragStart,
    handleDragEnd,
  } = useSortableList({ folders: turfFolders });

  const activeTurf = useMemo(
    () => turfs.find((t) => `item-${t.id}` === activeId),
    [activeId, turfs],
  );

  const sortedFolders = useMemo(() => {
    return sortByPositionAndId(turfFolders);
  }, [turfFolders]);

  const hasTurfs = turfs.length || turfFolders.length;

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
        <div className="flex flex-col gap-1">
          {!hasTurfs && (
            <EmptyLayer
              message="Add an Area Layer"
              onClick={onAddArea}
              showAsButton
            />
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
                turfs={turfs.filter((t) => t.folderId === folder.id)}
                activeId={activeId}
                setKeyboardCapture={setKeyboardCapture}
              />
            ))}
          </SortableContext>
        </div>

        {/* Unassigned turfs */}
        <div>
          <UnassignedFolder
            turfs={turfs.filter((t) => !t.folderId)}
            activeId={activeId}
            folders={turfFolders}
            setKeyboardCapture={setKeyboardCapture}
          />
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeId && activeTurf && <TurfDragOverlay turf={activeTurf} />}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}
