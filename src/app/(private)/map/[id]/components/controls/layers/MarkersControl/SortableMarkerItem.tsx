import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Pencil, Trash2 } from "lucide-react";
import { SyntheticEvent, useContext, useRef, useState } from "react";
import { PlacedMarker } from "@/__generated__/types";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { mapColors } from "@/components/Map/styles";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
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
  const inputRef = useRef<HTMLInputElement>(null);
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

  const flyToMarker = (e: SyntheticEvent<HTMLElement>) => {
    const map = mapRef?.current;

    // Don't fly if currently dragging, clicking delete, or no map present
    if (
      isEditing ||
      isCurrentlyDragging ||
      (e.target as HTMLElement).closest("button") ||
      !map
    ) {
      return;
    }

    map.flyTo({
      center: marker.point,
      zoom: 12,
    });
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
          onClick={flyToMarker}
        >
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePlacedMarker({ ...marker, label: editText });
                setEditing(false);
                setKeyboardCapture(false);
              }}
              className="w-full flex items-center gap-1"
            >
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1"
                ref={inputRef}
              />
              <Button type="submit" size="sm" variant="ghost">
                <Check className="h-3 w-3" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 flex-grow text-sm p-0.5">
              <div
                className="w-2 h-2 rounded-full aspect-square"
                style={{ backgroundColor: mapColors.markers.color }}
              />
              <span className="break-all">{marker.label}</span>
            </div>
          )}
        </li>
      </ContextMenuTrigger>
      <ContextMenuContentWithFocus
        targetRef={inputRef}
        shouldFocusTarget={isEditing}
      >
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
      </ContextMenuContentWithFocus>
    </ContextMenu>
  );
}
