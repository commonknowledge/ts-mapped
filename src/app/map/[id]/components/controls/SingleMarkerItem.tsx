import { CheckIcon } from "lucide-react";
import { useContext, useRef, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { Button } from "@/shadcn/ui/button";
import { ContextMenu, ContextMenuTrigger } from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import ControlContextMenuContent from "./ControlContextMenuContent";
import LayerItemWrapper from "./LayerItemWrapper";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

export default function SingleMarkerItem({
  disableClick = false,
  marker,
  setKeyboardCapture,
}: {
  marker: PlacedMarker;
  disableClick?: boolean;
  setKeyboardCapture: (captured: boolean) => void;
}) {
  const {
    setSelectedPlacedMarkerId,
    getMarkerVisibility,
    setMarkerVisibilityState,
    deletePlacedMarker,
    updatePlacedMarker,
  } = useContext(MarkerAndTurfContext);
  const { mapRef } = useContext(MapContext);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(marker.label);

  const isVisible = getMarkerVisibility(marker.id);

  const flyToMarker = () => {
    const map = mapRef?.current;

    if (disableClick || isEditing || !map) {
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
    <LayerItemWrapper
      name={marker?.label}
      isVisible={isVisible}
      onVisibilityToggle={() => setMarkerVisibilityState(marker.id, !isVisible)}
    >
      {isEditing ? (
        <form
          className="w-full flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1"
            ref={inputRef}
          />
          <Button type="submit" size="sm" variant="ghost" aria-label="Save">
            <CheckIcon size={12} />
          </Button>
        </form>
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              className="w-full hover:bg-neutral-100 text-left cursor-pointer"
              onClick={() => flyToMarker()}
            >
              {marker.label}
            </button>
          </ContextMenuTrigger>
          <ControlContextMenuContent
            inputRef={inputRef}
            isEditing={isEditing}
            onEdit={() => onEdit()}
            onDelete={() => deletePlacedMarker(marker.id)}
          />
        </ContextMenu>
      )}
    </LayerItemWrapper>
  );
}
