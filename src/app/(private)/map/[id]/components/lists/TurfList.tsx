import * as turfLib from "@turf/turf";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Turf } from "@/__generated__/types";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";

export default function TurfList() {
  const { viewConfig, mapRef, turfs, setEditingTurf, updateTurf, deleteTurf } =
    useContext(MapContext);
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
      {} as Record<string, string>,
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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <ul className={`${viewConfig.showTurf ? "opacity-100" : "opacity-50"}`}>
          {turfs.map((turf, index) => (
            <div
              key={turf.id}
              className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
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
                    <div className="text-gray-400 text-xs">
                      {index === 0 ? "Your Organisation" : `GND Rising`}
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
                  (t, i) => i === contextMenuIndex,
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
  );
}
