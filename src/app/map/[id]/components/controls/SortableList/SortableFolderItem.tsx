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
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { sortByPositionAndId } from "@/app/map/[id]/utils/position";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { useFolderMutations } from "../../../hooks/useFolders";
import { useMapConfig } from "../../../hooks/useMapConfig";
import { usePlacedMarkerState } from "../../../hooks/usePlacedMarkers";
import { useTurfMutations } from "../../../hooks/useTurfMutations";
import { useTurfState } from "../../../hooks/useTurfState";
import { mapColors } from "../../../styles";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
import LayerIcon from "../LayerIcon";
import SortableMarkerItem from "../MarkersControl/SortableMarkerItem";
import SortableTurfItem from "../TurfsControl/SortableTurfItem";
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
  const { getTurfVisibility, setTurfVisibility } = useTurfState();
  const { updateTurf: updateTurfMutation } = useTurfMutations();

  const { updateFolder, deleteFolder } = useFolderMutations();
  const { mapConfig, updateMapConfig } = useMapConfig();

  const isTurfFolder = folder.type === "turf";

  // Get current folder color (defaults based on folder type)
  const defaultFolderColor = isTurfFolder
    ? mapColors.areas.color
    : mapColors.markers.color;
  const currentFolderColor =
    mapConfig.folderColors?.[folder.id] ?? defaultFolderColor;

  const handleFolderColorChange = (color: string) => {
    const updatedFolderColors = {
      ...mapConfig.folderColors,
      [folder.id]: color,
    };

    if (isTurfFolder) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      turfs.forEach(({ mapId, ...rest }) => {
        updateTurfMutation({ ...rest, color });
      });
      updateMapConfig({ folderColors: updatedFolderColors });
    } else {
      // Update folder color and all marker colors in one operation
      const updatedMarkerColors = { ...mapConfig.placedMarkerColors };
      markers.forEach((marker) => {
        updatedMarkerColors[marker.id] = color;
      });
      updateMapConfig({
        folderColors: updatedFolderColors,
        placedMarkerColors: updatedMarkerColors,
      });
    }
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

  const getItemVisibility = isTurfFolder
    ? getTurfVisibility
    : getPlacedMarkerVisibility;
  const setItemVisibility = isTurfFolder
    ? setTurfVisibility
    : setPlacedMarkerVisibility;

  const visibleItems = useMemo(
    () => sortedItems.filter((item) => getItemVisibility(item.id)),
    [sortedItems, getItemVisibility],
  );
  const isFolderVisible = sortedItems?.length
    ? Boolean(visibleItems?.length)
    : true;

  const onVisibilityToggle = () => {
    sortedItems.forEach((item) => setItemVisibility(item.id, !isFolderVisible));
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ControlWrapper
        name={folder.name}
        layerType={isTurfFolder ? LayerType.Turf : LayerType.Marker}
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
              <div
                className="flex items-center gap-2 w-full min-h-full"
                onContextMenu={(e) => {
                  if (isCurrentlyDragging) {
                    e.preventDefault();
                  }
                }}
              >
                <LayerIcon
                  layerType={isTurfFolder ? LayerType.Turf : LayerType.Marker}
                  isDataSource={false}
                  layerColor={currentFolderColor}
                  onColorChange={handleFolderColorChange}
                  isFolder
                  isFolderExpanded={isExpanded}
                />
                <button
                  ref={isDraggingMarker ? setHeaderNodeRef : null}
                  onClick={() => onClickFolder()}
                  className={cn(
                    "flex flex-col items-start w-full min-h-full p-1 rounded transition-colors hover:bg-neutral-100 text-left cursor-pointer",
                    isHeaderOver ? "bg-blue-50" : "",
                  )}
                >
                  <div className="text-sm font-medium truncate">
                    {folder.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {sortedItems.length} {isTurfFolder ? "areas" : "locations"}
                  </div>
                </button>
              </div>
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
          {sortedItems.length > 0 ? (
            <ul className="flex flex-col gap-1 mt-2 ml-2">
              <SortableContext
                items={sortedItems.map((item) => `item-${item.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {sortedItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-1 w-full">
                    <CornerDownRightIcon
                      size={16}
                      className="text-neutral-400"
                    />
                    {"polygon" in item ? (
                      <SortableTurfItem
                        key={item.id}
                        turf={item}
                        activeId={activeId}
                        setKeyboardCapture={setKeyboardCapture}
                      />
                    ) : (
                      <SortableMarkerItem
                        key={item.id}
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
        description={`This action cannot be undone. This will permanently delete the folder "${folder.name}" and any ${isTurfFolder ? "areas" : "markers"} in the folder will be lost.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
