import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CornerDownRightIcon,
  EyeIcon,
  EyeOffIcon,
  Folder as FolderClosed,
  FolderOpen,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";

import { sortByPositionAndId } from "@/app/map/[id]/utils";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { useFolderMutations } from "../../../hooks/useFolders";
import { usePlacedMarkerState } from "../../../hooks/usePlacedMarkers";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
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

  const { getPlacedMarkerVisibility, setPlacedMarkerVisibility } =
    usePlacedMarkerState();

  const { updateFolder, deleteFolder } = useFolderMutations();

  const [isExpanded, setExpanded] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(folder.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const sortedMarkers = useMemo(() => {
    return sortByPositionAndId(markers);
  }, [markers]);

  const onClickFolder = () => {
    if (isCurrentlyDragging || isEditing) {
      return;
    }

    setExpanded(!isExpanded);
  };

  const handleDelete = () => {
    deleteFolder(folder.id);
    setShowDeleteDialog(false);
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

  const visibleMarkers = useMemo(
    () =>
      sortedMarkers.filter((marker) => getPlacedMarkerVisibility(marker.id)),
    [sortedMarkers, getPlacedMarkerVisibility],
  );
  const isFolderVisible = sortedMarkers?.length
    ? Boolean(visibleMarkers?.length)
    : true;

  const onVisibilityToggle = () => {
    sortedMarkers.forEach((marker) =>
      setPlacedMarkerVisibility(marker.id, !isFolderVisible),
    );
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ControlWrapper
        name={folder.name}
        layerType={LayerType.Marker}
        isVisible={isFolderVisible}
        onVisibilityToggle={() => onVisibilityToggle()}
      >
        {isEditing ? (
          <ControlEditForm
            initialValue={editText}
            onChange={setEditText}
            onSubmit={onSubmit}
          />
        ) : (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button
                ref={isDraggingMarker ? setHeaderNodeRef : null}
                onClick={() => onClickFolder()}
                className={cn(
                  "flex items-center gap-1 / w-full min-h-full p-1 rounded / transition-colors hover:bg-neutral-100 / text-left cursor-pointer",
                  isHeaderOver ? "bg-blue-50" : "",
                )}
                onContextMenu={(e) => {
                  // Prevent context menu during drag
                  if (isCurrentlyDragging) {
                    e.preventDefault();
                  }
                }}
              >
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <FolderClosed className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs text-muted-foreground transition-transform duration-30 rounded-full bg-neutral-50 px-1">
                  {sortedMarkers.length}
                </span>
                {folder.name}
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={onEdit}>
                <PencilIcon size={12} />
                Rename
              </ContextMenuItem>
              <ContextMenuItem onClick={onVisibilityToggle}>
                {isFolderVisible ? (
                  <>
                    <EyeOffIcon size={12} />
                    Hide
                  </>
                ) : (
                  <>
                    <EyeIcon size={12} />
                    Show
                  </>
                )}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon size={12} />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </ControlWrapper>

      {isExpanded && (
        <>
          {sortedMarkers.length > 0 ? (
            <ul className="flex flex-col gap-1 mt-2 ml-2">
              <SortableContext
                items={sortedMarkers.map((marker) => `marker-${marker.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {sortedMarkers.map((marker, index) => (
                  <li
                    key={`${marker.id}-${index}`}
                    className="flex items-center gap-1 w-full"
                  >
                    <CornerDownRightIcon
                      size={16}
                      className="text-neutral-400"
                    />
                    <SortableMarkerItem
                      marker={marker}
                      activeId={activeId}
                      setKeyboardCapture={setKeyboardCapture}
                    />
                  </li>
                ))}
              </SortableContext>
            </ul>
          ) : (
            <div className="ml-3 mt-1 text-sm text-muted-foreground">
              No markers in this folder
            </div>
          )}
          {/* Invisible footer drop zone */}
          <div
            ref={isDraggingMarker ? setFooterNodeRef : null}
            className={`h-2 rounded`}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              folder "{folder.name}" and any markers in the folder will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
