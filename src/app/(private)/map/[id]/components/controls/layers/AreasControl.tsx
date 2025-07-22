import * as turfLib from "@turf/turf";
import { Check, Pencil, PlusIcon, Trash2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Turf } from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import Loading from "../../Loading";
import LayerHeader from "../LayerHeader";

export default function AreasControl() {
  const { viewConfig, mapRef, updateViewConfig } = useContext(MapContext);
  const { turfs, turfsLoading, setEditingTurf, updateTurf, deleteTurf } =
    useContext(MarkerAndTurfContext);
  const { getOrganisation } = useContext(OrganisationsContext);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
  const [, setFormattedDates] = useState<Record<string, string>>({});

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

  const handleAddArea = () => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon"
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
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
        <IconButtonWithTooltip
          tooltip="Add Area"
          onClick={() => {
            handleAddArea();
          }}
        >
          <PlusIcon className="w-4 h-4" />
        </IconButtonWithTooltip>
      </LayerHeader>

      <div className="relative">
        {/* Disable interactions while turfs are loading/updating in the background */}
        {turfsLoading && <Loading blockInteraction />}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <ul
              className={`${viewConfig.showTurf ? "opacity-100" : "opacity-50"}`}
            >
              {turfs.map((turf, index) => (
                <div
                  key={turf.id}
                  className="flex justify-between items-center p-1 hover:bg-neutral-100 rounded cursor-pointer text-sm"
                  onClick={() => handleFlyTo(turf)}
                  onContextMenu={() => setContextMenuIndex(index)}
                >
                  {editingIndex === index ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateTurf({ ...turf, label: editText });
                        setEditingIndex(null);
                      }}
                      className="w-full flex items-center p-0"
                    >
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit" variant="link">
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <div>{turf.label}</div>
                        <div className="text-neutral-400 text-xs">
                          {getOrganisation()?.name || "Unknown organisation"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </ul>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {contextMenuIndex !== null && (
              <>
                <ContextMenuItem
                  onClick={() => {
                    const turf = turfs[contextMenuIndex];
                    setEditText(turf.label);
                    setEditingIndex(contextMenuIndex);
                    setEditingTurf(turf);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    const existingTurf = turfs.find(
                      (t, i) => i === contextMenuIndex
                    );
                    if (existingTurf) {
                      deleteTurf(existingTurf.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
}
