import * as turfLib from "@turf/turf";
import { useContext, useRef, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { ContextMenu, ContextMenuTrigger } from "@/shadcn/ui/context-menu";
import { CONTROL_PANEL_WIDTH } from "../../styles";
import ControlContextMenuContent from "./ControlContextMenuContent";
import ControlEditForm from "./ControlEditForm";
import LayerItemWrapper from "./LayerItemWrapper";
import type { Turf } from "@/server/models/Turf";

export default function TurfItem({ turf }: { turf: Turf }) {
  const { mapRef, showControls } = useContext(MapContext);
  const { getTurfVisibility, setTurfVisibilityState, updateTurf, deleteTurf } =
    useContext(MarkerAndTurfContext);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(turf.label);

  const handleFlyTo = (turf: Turf) => {
    const map = mapRef?.current;
    if (!map) return;

    // the bounding box of the polygon
    const bbox = turfLib.bbox(turf.polygon);
    const padding = 20;

    map.fitBounds(
      [
        [bbox[0], bbox[1]], // southwest corner
        [bbox[2], bbox[3]], // northeast corner
      ],
      {
        padding: {
          left: showControls ? CONTROL_PANEL_WIDTH + padding : padding,
          top: padding,
          right: padding,
          bottom: padding,
        },
        duration: 1000,
      },
    );
  };

  const isVisible = getTurfVisibility(turf.id);

  const onSubmit = () => {
    updateTurf({ ...turf, label: editText });
    setEditing(false);
  };

  return (
    <LayerItemWrapper
      name={turf.label}
      isVisible={isVisible}
      onVisibilityToggle={() => setTurfVisibilityState(turf.id, !isVisible)}
    >
      {isEditing ? (
        <ControlEditForm
          inputRef={inputRef}
          initialValue={editText}
          onChange={setEditText}
          onSubmit={onSubmit}
        />
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              className="w-full overflow-hidden / flex items-center gap-2 / text-sm text-left / cursor-pointer"
              onClick={() => handleFlyTo(turf)}
            >
              <span className="truncate">
                {turf.label || `Area: ${turf.area?.toFixed(2)}m²`}
              </span>
            </button>
          </ContextMenuTrigger>
          <ControlContextMenuContent
            inputRef={inputRef}
            onDelete={() => deleteTurf(turf.id)}
            onEdit={() => setEditing(true)}
          />
        </ContextMenu>
      )}
    </LayerItemWrapper>
  );
}
