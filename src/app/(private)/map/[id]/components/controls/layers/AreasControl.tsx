import * as turfLib from "@turf/turf";
import { ArrowRight, Check, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Turf } from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import Loading from "../../Loading";
import LayerHeader from "../LayerHeader";

export default function AreasControl() {
  const { viewConfig, mapRef, updateViewConfig } = useContext(MapContext);
  const { turfs, turfsLoading } = useContext(MarkerAndTurfContext);
  const [, setFormattedDates] = useState<Record<string, string>>({});
  const [isAddingArea, setAddingArea] = useState(false);

  // TODO: display these dates somewhere
  useEffect(() => {
    // Format dates only on client-side
    const dates = turfs.reduce(
      (acc, t) => {
        acc[t.id] = new Date(t.createdAt)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        return acc;
      },
      {} as Record<string, string>
    );

    setFormattedDates(dates);
  }, [turfs]);

  const handleAddArea = () => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon"
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
        setAddingArea(true);
        setTimeout(() => {
          setAddingArea(false);
        }, 5000);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1 p-2">
      <LayerHeader
        label="Areas"
        color={mapColors.areas.color}
        showLayer={viewConfig.showTurf}
        setLayer={(show) => updateViewConfig({ showTurf: show })}
      >
        {!isAddingArea ? (
          <IconButtonWithTooltip
            tooltip="Add Area"
            onClick={() => {
              handleAddArea();
            }}
          >
            <PlusIcon className="w-4 h-4" />
          </IconButtonWithTooltip>
        ) : (
          <div className="flex text-xs items-center text-muted-foreground gap-0.5">
            <span>Draw</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </LayerHeader>

      <div className="relative">
        {/* Disable interactions while turfs are loading/updating in the background */}
        {turfsLoading && <Loading blockInteraction />}
        <ul
          className={`ml-1 ${viewConfig.showTurf ? "opacity-100" : "opacity-50"}`}
        >
          {turfs.map((turf) => (
            <TurfItem key={turf.id} turf={turf} />
          ))}
        </ul>
      </div>
    </div>
  );
}

const TurfItem = ({ turf }: { turf: Turf }) => {
  const [isEditing, setEditing] = useState(false);
  const [editText, setEditText] = useState(turf.label);
  const { mapRef } = useContext(MapContext);
  const { updateTurf, deleteTurf } = useContext(MarkerAndTurfContext);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFlyTo = (turf: Turf) => {
    // Calculate the center of the polygon using turf.js
    const center = turfLib.center(turf.geometry);
    const map = mapRef?.current;
    if (map) {
      map.flyTo({
        center: center.geometry.coordinates as [number, number],
        zoom: 12,
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="flex justify-between items-center p-0.5 hover:bg-neutral-100 rounded cursor-pointer text-sm"
          onClick={() => handleFlyTo(turf)}
        >
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTurf({ ...turf, label: editText });
                setEditing(false);
              }}
              className="w-full flex items-center p-0"
            >
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                ref={inputRef}
              />
              <Button type="submit" variant="link">
                <Check className="h-3 w-3" />
              </Button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2 pl-1">
                <div
                  style={{ backgroundColor: mapColors.areas.color }}
                  className="w-2 h-2 rounded-full"
                />

                <div className="text-sm">{turf.label}</div>
              </div>
            </>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContentWithFocus targetRef={inputRef} shouldFocusTarget={isEditing}>
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
