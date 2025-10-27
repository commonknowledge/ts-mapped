import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { CheckIcon, Folder as FolderClosed, FolderOpen } from "lucide-react";
import { useContext, useMemo, useRef, useState } from "react";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { sortByPositionAndId } from "@/app/map/[id]/utils";
import { Button } from "@/shadcn/ui/button";
import { ContextMenu } from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import ControlContextMenuContent from "../../ControlContextMenuContent";
import LayerItemWrapper from "../../LayerItemWrapper";
import SortableMarkerItem from "./SortableMarkerItem";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export default function SortableFolderItem({
  folder,
  markers,
  activeId,
  setKeyboardCapture,
}: {
  folder: Folder;
  markers: PlacedMarker[];
  activeId: string | null;
  isPulsing: boolean;
  setKeyboardCapture: (captured: boolean) => void;
}) {
  const { setNodeRef: setHeaderNodeRef, isOver: isHeaderOver } = useDroppable({
    id: `folder-${folder.id}`,
  });

  const { setNodeRef: setFooterNodeRef } = useDroppable({
    id: `folder-footer-${folder.id}`,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `folder-drag-${folder.id}` });

  // Check if this folder is the one being dragged
  const isCurrentlyDragging =
    isDragging || activeId === `folder-drag-${folder.id}`;
  const isDraggingMarker = activeId?.startsWith("marker-");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.3 : 1,
  };

  const { updateFolder, deleteFolder } = useContext(MarkerAndTurfContext);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setExpanded] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(folder.name);

  const sortedMarkers = useMemo(() => {
    return sortByPositionAndId(markers);
  }, [markers]);

  const onClickFolder = () => {
    if (isCurrentlyDragging || isEditing) {
      return;
    }

    setExpanded(!isExpanded);
  };

  const onDelete = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this folder? This action cannot be undone, and any markers in the folder will be lost.",
      )
    ) {
      return;
    }
    deleteFolder(folder.id);
  };

  const onEdit = () => {
    setEditText(folder.name);
    setEditing(true);
    setKeyboardCapture(true);
  };

  const onSubmit = () => {
    updateFolder({ ...folder, name: editText });
    setEditing(false);
    setKeyboardCapture(false);
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LayerItemWrapper
        name={folder.name}
        isVisible={!folder.hideMarkers}
        onVisibilityToggle={() => {
          updateFolder({ ...folder, hideMarkers: !folder.hideMarkers });
        }}
      >
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="w-full flex items-center gap-1"
          >
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              ref={inputRef}
              className="flex-1 h-7 px-1"
            />
            <Button type="submit" size="sm" variant="ghost" className="p-0">
              <CheckIcon size={16} />
            </Button>
          </form>
        ) : (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button
                ref={isDraggingMarker ? setHeaderNodeRef : null}
                onClick={() => onClickFolder()}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium flex-1 break-all py-1",
                  isHeaderOver ? "bg-blue-50" : "",
                )}
              >
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <FolderClosed className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                {folder.name}
              </button>
            </ContextMenuTrigger>
            <ControlContextMenuContent
              inputRef={inputRef}
              isEditing={isEditing}
              onDelete={() => onDelete()}
              onEdit={() => onEdit()}
            />
          </ContextMenu>
        )}
      </LayerItemWrapper>

      {isExpanded && (
        <>
          {sortedMarkers.length > 0 ? (
            <ol className="ml-4 mt-2 space-y-0.5">
              <SortableContext
                items={sortedMarkers.map((marker) => `marker-${marker.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {sortedMarkers.map((marker, index) => (
                  <SortableMarkerItem
                    key={`${marker.id}-${index}`}
                    marker={marker}
                    activeId={activeId}
                    setKeyboardCapture={setKeyboardCapture}
                  />
                ))}
              </SortableContext>
            </ol>
          ) : (
            <div className="ml-3 mt-1 text-sm text-muted-foreground">
              No markers in this folder
            </div>
          )}
          {/* Invisible footer drop zone */}
          <div
            ref={isDraggingMarker ? setFooterNodeRef : null}
            className={`h-2 ml-4 mt-1 rounded`}
          />
        </>
      )}
    </li>
  );
}
