import * as turfLib from "@turf/turf";
import { useContext, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";

import { ContextMenu, ContextMenuTrigger } from "@/shadcn/ui/context-menu";
import { LayerType } from "@/types";
import { useTurfMutations } from "../../../hooks/useTurfs";
import { useTurfState } from "@/app/map/[id]/hooks/useTurfState";
import { CONTROL_PANEL_WIDTH } from "../../../styles";
import ControlContextMenuContent from "../ControlContextMenuContent";
import ControlEditForm from "../ControlEditForm";
import ControlWrapper from "../ControlWrapper";
import type { Turf } from "@/server/models/Turf";

export default function TurfItem({ turf }: { turf: Turf }) {
  const { mapRef, showControls } = useContext(MapContext);
  const { getTurfVisibility, setTurfVisibilityState } = useTurfState();
  const { updateTurf, deleteTurf } = useTurfMutations();

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

  const onEdit = () => {
    setEditing(true);
  };

  const onSubmit = () => {
    updateTurf({ ...turf, label: editText });
    setEditing(false);
  };

  return (
    <ControlWrapper
      name={turf.label}
      layerType={LayerType.Turf}
      isVisible={isVisible}
      onVisibilityToggle={() => setTurfVisibilityState(turf.id, !isVisible)}
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
              onClick={() => handleFlyTo(turf)}
            >
              {turf.label || `Area: ${turf.area?.toFixed(2)}m²`}
            </button>
          </ContextMenuTrigger>
          <ControlContextMenuContent
            onDelete={() => deleteTurf(turf.id)}
            onEdit={() => onEdit()}
          />
        </ContextMenu>
      )}
    </ControlWrapper>
  );
}
