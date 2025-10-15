import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, CornerDownRight, Pencil, Trash2 } from "lucide-react";
import { useContext, useRef, useState } from "react";
import { InspectorContentFactory } from "@/app/map/[id]/components/inspector/inspectorContentFactory";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import EditOptions from "@/components/EditOptions";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import LayerItem from "../../LayerItem";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { SyntheticEvent } from "react";

export default function SortableMarkerItem({
  marker,
  activeId,
  setKeyboardCapture,
  isInFolder = false,
}: {
  marker: PlacedMarker;
  activeId: string | null;
  setKeyboardCapture: (captured: boolean) => void;
  isInFolder?: boolean;
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
  const {
    updatePlacedMarker,
    deletePlacedMarker,
    setSelectedPlacedMarkerId,
    getMarkerVisibility,
    setMarkerVisibilityState,
    folders,
  } = useContext(MarkerAndTurfContext);
  const { setInspectorContent } = useContext(InspectorContext);

  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(marker.label);
  const isVisible = getMarkerVisibility(marker.id); // Get visibility from context

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

    setSelectedPlacedMarkerId(marker.id);
    map.flyTo({
      center: marker.point,
      zoom: 12,
    });

    // Use the factory to create consistent inspector content
    const inspectorData =
      InspectorContentFactory.createPlacedMarkerInspectorContent(
        marker,
        folders,
      );
    setInspectorContent(inspectorData);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
          {isInFolder ? (
            <div className="flex items-center gap-1">
              <CornerDownRight className="w-4 h-4 text-neutral-400" />
              <LayerItem
                onClick={flyToMarker}
                layerType="locations"
                individualVisibility={true}
                isVisible={isVisible}
                onVisibilityToggle={() =>
                  setMarkerVisibilityState(marker.id, !isVisible)
                }
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updatePlacedMarker({
                        ...marker,
                        label: editText,
                      });
                      setEditing(false);
                      setKeyboardCapture(false);
                    }}
                    className="w-full flex items-center gap-2"
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
                  <>
                    <div className="flex-1">
                      <div className="text-sm">{marker.label}</div>
                    </div>
                    <div className="hidden group-hover:flex gap-1 text-muted-foreground absolute right-0 bg-white z-10">
                      <EditOptions
                        onRename={() => {
                          setEditText(marker.label);
                          setEditing(true);
                          setKeyboardCapture(true);
                        }}
                        onDelete={() => deletePlacedMarker(marker.id)}
                        size="sm"
                      />
                    </div>
                  </>
                )}
              </LayerItem>
            </div>
          ) : (
            <LayerItem
              onClick={flyToMarker}
              layerType="locations"
              individualVisibility={true}
              isVisible={isVisible}
              onVisibilityToggle={() =>
                setMarkerVisibilityState(marker.id, !isVisible)
              }
            >
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updatePlacedMarker({
                      ...marker,
                      label: editText,
                    });
                    setEditing(false);
                    setKeyboardCapture(false);
                  }}
                  className="w-full flex items-center gap-2"
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
                <>
                  <div className="flex-1">
                    <div className="text-sm">{marker.label}</div>
                  </div>
                  <div className="hidden group-hover:flex gap-1 text-muted-foreground absolute right-0 bg-white z-10">
                    <EditOptions
                      onRename={() => {
                        setEditText(marker.label);
                        setEditing(true);
                        setKeyboardCapture(true);
                      }}
                      onDelete={() => deletePlacedMarker(marker.id)}
                      size="sm"
                    />
                  </div>
                </>
              )}
            </LayerItem>
          )}
        </div>
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
