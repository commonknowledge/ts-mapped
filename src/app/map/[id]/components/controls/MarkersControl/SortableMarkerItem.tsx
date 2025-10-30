import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useContext, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { ContextMenu, ContextMenuTrigger } from "@/shadcn/ui/context-menu";
import { LayerType } from "@/types";
import { usePlacedMarkerMutations } from "../../../hooks/usePlacedMarkers";
import ControlContextMenuContent from "../ControlContextMenuContent";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
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
  } = useSortable({ id: `marker-${marker.id}` });

  const {
    setSelectedPlacedMarkerId,
    getMarkerVisibility,
    setMarkerVisibilityState,
  } = useContext(MarkerAndTurfContext);
  const { updatePlacedMarker, deletePlacedMarker } = usePlacedMarkerMutations();
  const { mapRef } = useContext(MapContext);
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(marker.label);

  // Check if this marker is the one being dragged (even outside its container)
  const isCurrentlyDragging = isDragging || activeId === `marker-${marker.id}`;
  const isVisible = getMarkerVisibility(marker.id);

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

  const onEdit = () => {
    setEditText(marker.label);
    setEditing(true);
    setKeyboardCapture(true);
  };

  const onSubmit = () => {
    updatePlacedMarker({
      ...marker,
      label: editText,
    });
    setEditing(false);
    setKeyboardCapture(false);
  };

  return (
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
          setMarkerVisibilityState(marker.id, !isVisible)
        }
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
                className="flex items-center gap-2 / w-full min-h-full p-1 rounded / transition-colors hover:bg-neutral-100 / text-left cursor-pointer"
                onClick={() => flyToMarker()}
              >
                {marker.label}
              </button>
            </ContextMenuTrigger>
            <ControlContextMenuContent
              onEdit={() => onEdit()}
              onDelete={() => deletePlacedMarker(marker.id)}
            />
          </ContextMenu>
        )}
      </ControlWrapper>
    </div>
  );
}
