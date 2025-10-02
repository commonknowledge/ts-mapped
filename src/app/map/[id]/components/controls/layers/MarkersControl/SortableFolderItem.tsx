import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  EyeIcon,
  EyeOffIcon,
  Folder as FolderClosed,
  FolderOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import { useContext, useMemo, useRef, useState } from "react";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { sortByPositionAndId } from "@/app/map/[id]/utils";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import SortableMarkerItem from "./SortableMarkerItem";
import type { Folder, PlacedMarker } from "@/__generated__/types";
import type { SyntheticEvent } from "react";

// Folder component
export default function SortableFolderItem({
  folder,
  markers,
  activeId,
  isPulsing,
  setKeyboardCapture,
}: {
  folder: Folder;
  markers: PlacedMarker[];
  activeId: string | null;
  isPulsing: boolean;
  setKeyboardCapture: (captured: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

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

  const [isExpanded, setExpanded] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(folder.name);

  const sortedMarkers = useMemo(() => {
    return sortByPositionAndId(markers);
  }, [markers]);

  const onClickFolder = (e: SyntheticEvent<HTMLElement>) => {
    // Don't toggle if currently dragging, clicking delete, or no map present
    if (
      isEditing ||
      isCurrentlyDragging ||
      (e.target as HTMLElement).closest("button")
    ) {
      return;
    }

    setExpanded(!isExpanded);
  };

  const onClickDelete = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this folder? This action cannot be undone, and any markers in the folder will be lost.",
      )
    ) {
      return;
    }
    deleteFolder(folder.id);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border border-neutral-200 rounded-sm mb-2"
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={isDraggingMarker ? setHeaderNodeRef : null}
            className={`flex items-center gap-2 hover:bg-neutral-100  transition-colors px-2 py-1 ${
              isHeaderOver ? "bg-blue-50" : ""
            } ${folder.hideMarkers ? "opacity-70" : ""}`}
            onClick={onClickFolder}
          >
            {folder.hideMarkers ? (
              <EyeOffIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : isExpanded ? (
              <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <FolderClosed className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateFolder({ ...folder, name: editText });
                  setEditing(false);
                  setKeyboardCapture(false);
                }}
                className="w-full flex items-center gap-1"
              >
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  ref={inputRef}
                  className="flex-1 h-7 px-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="p-0 h-7"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <span className="text-sm font-medium flex-1 break-all py-1">
                {folder.name}
              </span>
            )}
            <span
              className={cn(
                "text-xs text-muted-foreground  transition-transform duration-30 rounded-full bg-neutral-50 px-1",
                isPulsing ? "animate-pulse  transform scale-110" : "",
              )}
              style={{
                color: isPulsing ? "green" : "",
              }}
            >
              {sortedMarkers.length}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContentWithFocus
          shouldFocusTarget={isEditing}
          targetRef={inputRef}
        >
          <ContextMenuItem
            onClick={() => {
              // update when context menu no longer visible
              setTimeout(() => {
                updateFolder({ ...folder, hideMarkers: !folder.hideMarkers });
              }, 200);
            }}
          >
            {folder.hideMarkers ? (
              <>
                <EyeIcon className="h-4 w-4" />
                Show
              </>
            ) : (
              <>
                <EyeOffIcon className="h-4 w-4" />
                Hide
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setEditText(folder.name);
              setEditing(true);
              setKeyboardCapture(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onClickDelete()}>
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContentWithFocus>
      </ContextMenu>
      {isExpanded && (
        <>
          {sortedMarkers.length > 0 ? (
            <ol className="ml-3 mt-1 space-y-0.5">
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
