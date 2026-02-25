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
import { sortByPositionAndId } from "@/app/map/[id]/utils/position";
import ColorPalette from "@/components/ColorPalette";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { useFolderMutations } from "../../../hooks/useFolders";
import { useMapConfig } from "../../../hooks/useMapConfig";
import { usePlacedMarkerState } from "../../../hooks/usePlacedMarkers";
import { mapColors } from "../../../styles";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
import SortableMarkerItem from "../MarkersControl/SortableMarkerItem";
import TurfItem from "../TurfsControl/TurfItem";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { Turf } from "@/server/models/Turf";

export default function SortableFolderItem({
  folder,
  markers = [],
  turfs = [],
  activeId,
  setKeyboardCapture,
}: {
  folder: Folder;
  markers?: PlacedMarker[];
  turfs?: Turf[];
  activeId: string | null;
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
  const isDraggingMarker = activeId?.startsWith("item-");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.3 : 1,
  };

  const { getPlacedMarkerVisibility, setPlacedMarkerVisibility } =
    usePlacedMarkerState();

  const { updateFolder, deleteFolder } = useFolderMutations();
  const { mapConfig, updateMapConfig } = useMapConfig();

  // Get current folder color (defaults to marker color)
  const currentFolderColor =
    mapConfig.folderColors?.[folder.id] ?? mapColors.markers.color;

  const handleFolderColorChange = (color: string) => {
    // Update folder color and all marker colors in one operation
    const updatedMarkerColors = { ...mapConfig.placedMarkerColors };
    markers.forEach((marker) => {
      updatedMarkerColors[marker.id] = color;
    });

    updateMapConfig({
      folderColors: {
        ...mapConfig.folderColors,
        [folder.id]: color,
      },
      placedMarkerColors: updatedMarkerColors,
    });
  };

  const [isExpanded, setExpanded] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(folder.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const sortedItems = useMemo(() => {
    const items: (PlacedMarker | Turf)[] = markers;
    return sortByPositionAndId(items.concat(turfs));
  }, [markers, turfs]);

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
    () => sortedItems.filter((marker) => getPlacedMarkerVisibility(marker.id)),
    [sortedItems, getPlacedMarkerVisibility],
  );
  const isFolderVisible = sortedItems?.length
    ? Boolean(visibleMarkers?.length)
    : true;

  const onVisibilityToggle = () => {
    sortedItems.forEach((marker) =>
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
        color={currentFolderColor}
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
                  {sortedItems.length}
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
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded border border-neutral-300"
                      style={{ backgroundColor: currentFolderColor }}
                    />
                    <span>Color</span>
                  </div>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-auto p-2">
                  <ColorPalette
                    selectedColor={currentFolderColor}
                    onColorSelect={handleFolderColorChange}
                  />
                </ContextMenuSubContent>
              </ContextMenuSub>
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
          {sortedItems.length > 0 ? (
            <ul className="flex flex-col gap-1 mt-2 ml-2">
              <SortableContext
                items={sortedItems.map((item) => `item-${item.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {sortedItems.map((item, index) => (
                  <li
                    key={`${item.id}-${index}`}
                    className="flex items-center gap-1 w-full"
                  >
                    <CornerDownRightIcon
                      size={16}
                      className="text-neutral-400"
                    />
                    {"polygon" in item ? (
                      <TurfItem key={`${item.id}-${index}`} turf={item} />
                    ) : (
                      <SortableMarkerItem
                        key={`${item.id}-${index}`}
                        marker={item}
                        activeId={activeId}
                        setKeyboardCapture={setKeyboardCapture}
                      />
                    )}
                  </li>
                ))}
              </SortableContext>
            </ul>
          ) : (
            <div className="ml-3 mt-1 text-sm text-muted-foreground">
              This folder is empty
            </div>
          )}
          {/* Invisible footer drop zone */}
          <div
            ref={isDraggingMarker ? setFooterNodeRef : null}
            className="h-1"
          />
          <div className="h-3" />
        </>
      )}

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        description={`This action cannot be undone. This will permanently delete the folder "${folder.name}" and any markers in the folder will be lost.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
