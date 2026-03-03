"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { LayerType } from "@/types";
import { useMapConfig } from "../../../hooks/useMapConfig";
import { useMapRef } from "../../../hooks/useMapCore";
import {
  usePlacedMarkerMutations,
  usePlacedMarkerState,
} from "../../../hooks/usePlacedMarkers";
import { mapColors } from "../../../styles";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
import LayerIcon from "../LayerIcon";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export default function SortableMarkerItem({
  marker,
  activeId,
  setKeyboardCapture,
}: {
  marker: PlacedMarker;
  activeId: string | null;
  setKeyboardCapture: (captured: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${marker.id}` });

  const {
    setSelectedPlacedMarkerId,
    getPlacedMarkerVisibility,
    setPlacedMarkerVisibility,
  } = usePlacedMarkerState();
  const { updatePlacedMarker, deletePlacedMarker } = usePlacedMarkerMutations();
  const { mapConfig } = useMapConfig();
  const mapRef = useMapRef();
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(marker.label);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentColor =
    marker.color || mapConfig.placedMarkerColor || mapColors.markers.color;

  const handleColorChange = (color: string) => {
    updatePlacedMarker({
      ...marker,
      color,
    });
  };

  // Check if this marker is the one being dragged (even outside its container)
  const isCurrentlyDragging = isDragging || activeId === `item-${marker.id}`;
  const isVisible = getPlacedMarkerVisibility(marker.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.3 : 1,
  };

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (isCurrentlyDragging || isEditing || !map) {
      return;
    }

    setSelectedPlacedMarkerId(marker.id);
    map.flyTo({
      center: marker.point,
      zoom: 12,
    });
  };

  // Update editText when marker.label changes
  useEffect(() => {
    setEditText(marker.label);
  }, [marker.label]);

  const onEdit = () => {
    setEditText(marker.label);
    setEditing(true);
    setKeyboardCapture(true);
  };

  const onSubmit = () => {
    if (editText.trim() && editText !== marker.label) {
      updatePlacedMarker({
        ...marker,
        label: editText.trim(),
      });
      toast.success("Marker renamed successfully");
    }
    setEditing(false);
    setKeyboardCapture(false);
  };

  const handleDelete = () => {
    deletePlacedMarker(marker.id);
    setShowDeleteDialog(false);
    toast.success("Marker deleted successfully");
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing w-full"
      >
        <ControlWrapper
          name={marker?.label}
          layerType={LayerType.Marker}
          isVisible={isVisible}
          onVisibilityToggle={() =>
            setPlacedMarkerVisibility(marker.id, !isVisible)
          }
          color={currentColor}
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
                <div className="flex items-center justify-between">
                  <LayerIcon
                    layerType={LayerType.Marker}
                    isDataSource={false}
                    layerColor={currentColor}
                    onColorChange={handleColorChange}
                  />
                  <button
                    className="flex flex-col items-start w-full min-h-full p-1 rounded transition-colors hover:bg-neutral-100 text-left cursor-pointer"
                    onClick={() => flyToMarker()}
                    onContextMenu={(e) => {
                      // Prevent context menu during drag
                      if (isCurrentlyDragging) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="text-sm font-medium truncate">
                      {marker.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Individual marker
                    </div>
                  </button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={onEdit}>
                  <PencilIcon size={12} />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() =>
                    setPlacedMarkerVisibility(marker.id, !isVisible)
                  }
                >
                  {isVisible ? (
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
      </div>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        description={`This action cannot be undone. This will permanently delete the marker "${marker.label}".`}
        onConfirm={handleDelete}
      />
    </>
  );
}
