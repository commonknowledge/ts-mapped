import * as turfLib from "@turf/turf";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useContext, useRef, useState } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import EditOptions from "@/components/EditOptions";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import { CONTROL_PANEL_WIDTH, mapColors } from "../../../styles";
import EmptyLayer from "../Emptylayer";
import LayerItem from "../LayerItem";
import { defaultLayerStyles } from "../LayerStyles";
import type { Turf } from "@/server/models/Turf";

export default function AreasControl() {
  const { handleAddArea, turfs } = useContext(MarkerAndTurfContext);
  const [isAddingArea, setAddingArea] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const strokeColor = mapColors.areas.color;
  const fillColor = mapColors.areas.color + "50";

  const onAddArea = () => {
    handleAddArea();
    setAddingArea(true);

    setTimeout(() => {
      setAddingArea(false);
    }, 5000);
  };

  return (
    <div className={defaultLayerStyles.container}>
      {/* Header */}
      <div className={defaultLayerStyles.header}>
        <button
          className="flex items-center gap-2 hover:bg-neutral-100 rounded p-1 -m-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          )}
          <div
            className="w-3.5 h-3.5 rounded-xs"
            style={{
              border: `2px solid ${strokeColor}`,
              backgroundColor: fillColor,
            }}
          />
          <span className="text-sm font-medium">Areas</span>
        </button>
        {!isAddingArea ? (
          <IconButtonWithTooltip tooltip="Add Area" onClick={() => onAddArea()}>
            <Plus className="w-4 h-4" />
          </IconButtonWithTooltip>
        ) : (
          <div className="flex text-xs items-center text-muted-foreground gap-0.5">
            <span>Draw</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Layer Items */}
      {expanded && (
        <div className={cn(defaultLayerStyles.content, "space-y-1")}>
          {turfs && turfs.length > 0 ? (
            turfs.map((turf, index) => (
              <TurfItem key={turf.id} turf={turf} index={index} />
            ))
          ) : (
            <EmptyLayer message="Add an Area Layer" />
          )}
        </div>
      )}
    </div>
  );
}

const TurfItem = ({ turf, index }: { turf: Turf; index: number }) => {
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(turf.label);
  const { mapRef, showControls } = useContext(MapContext);
  const { updateTurf, deleteTurf, getTurfVisibility, setTurfVisibilityState } =
    useContext(MarkerAndTurfContext);
  const { setInspectorContent } = useContext(InspectorContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVisible = getTurfVisibility(turf.id); // Get visibility from context

  const handleLayerClick = (turf: Turf) => {
    const map = mapRef?.current;
    if (!map) return;

    // Fly to the area
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

    // Set the inspector content to show area data
    setInspectorContent({
      type: LayerType.Turf,
      name: turf.label || `Area ${index + 1}`,
      properties: {
        id: turf.id,
        area: `${turf.area?.toFixed(2)} m²`,
        notes: turf.notes || "No notes",
        created: turf.createdAt.toLocaleDateString(),
      },
      dataSource: null,
      id: turf.id,
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <LayerItem
          onClick={() => handleLayerClick(turf)}
          layerType="areas"
          individualVisibility={true}
          isVisible={isVisible}
          onVisibilityToggle={() => setTurfVisibilityState(turf.id, !isVisible)}
        >
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTurf({ ...turf, label: editText });
                setEditing(false);
              }}
              className="w-full flex items-center gap-2"
            >
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                ref={inputRef}
                className="flex-1"
              />
              <Button type="submit" variant="ghost" size="sm">
                <Check className="h-3 w-3" />
              </Button>
            </form>
          ) : (
            <>
              <div className="flex-1">
                <div className="text-sm">
                  {turf.label || `Area ${index + 1}`}
                </div>
              </div>
              <div className="hidden group-hover:flex gap-1 text-muted-foreground absolute right-0 bg-white z-10">
                <EditOptions
                  onRename={() => setEditing(true)}
                  onDelete={() => deleteTurf(turf.id)}
                  size="sm"
                />
              </div>
            </>
          )}
        </LayerItem>
      </ContextMenuTrigger>
      <ContextMenuContentWithFocus
        targetRef={inputRef}
        shouldFocusTarget={isEditing}
      >
        <ContextMenuItem
          onClick={() => {
            setEditing(true);
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            deleteTurf(turf.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContentWithFocus>
    </ContextMenu>
  );
};
