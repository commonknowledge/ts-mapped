import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useContext, useState } from "react";
import { PlacedMarker } from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";

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

  const { mapRef } = useContext(MapContext);
  const { updatePlacedMarker, deletePlacedMarker } =
    useContext(MarkerAndTurfContext);

  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(marker.label);

  // Check if this marker is the one being dragged (even outside its container)
  const isCurrentlyDragging = isDragging || activeId === `marker-${marker.id}`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.3 : 1,
  };

  const flyToMarker = () => {
    const map = mapRef?.current;
    if (map) {
      map.flyTo({
        center: marker.point,
        zoom: 12,
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 px-1 hover:bg-neutral-100 rounded cursor-grab active:cursor-grabbing"
        >
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePlacedMarker({
                  placedMarker: { ...marker, label: editText },
                });
                setEditing(false);
                setKeyboardCapture(false);
              }}
              className="w-full flex items-center gap-1"
            >
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="ghost">
                <Check className="h-3 w-3" />
              </Button>
            </form>
          ) : (
            <>
              <div
                className="flex items-center gap-1.5 flex-grow cursor-pointer text-sm"
                onClick={flyToMarker}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: mapColors.markers.color }}
                />
                {marker.label}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deletePlacedMarker(marker.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            setEditText(marker.label);
            setEditing(true);
            setKeyboardCapture(true);
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={() => deletePlacedMarker(marker.id)}>
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
