import * as turf from "@turf/turf";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { MapContext } from "@/app/(private)/map/context/MapContext";
import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { DrawnPolygon } from "@/types";

export default function TurfList() {
  const { mapConfig, mapRef, turfHistory, setEditingPolygon, setTurfHistory } =
    useContext(MapContext);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
  const [, setFormattedDates] = useState<Record<string, string>>({});

  // TODO: display these dates somewhere
  useEffect(() => {
    // Format dates only on client-side
    const dates = turfHistory.reduce(
      (acc, polygon) => {
        acc[polygon.id] = new Date(polygon.timestamp)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        return acc;
      },
      {} as Record<string, string>,
    );

    setFormattedDates(dates);
  }, [turfHistory]);

  const handleFlyTo = (polygon: DrawnPolygon) => {
    // Calculate the center of the polygon using turf.js
    const center = turf.center(polygon.geometry);
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
        <ul className={`${mapConfig.showTurf ? "opacity-100" : "opacity-50"}`}>
          {turfHistory.map((polygon, index) => (
            <div
              key={polygon.id}
              className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
              onClick={() => handleFlyTo(polygon)}
              onContextMenu={() => setContextMenuIndex(index)}
            >
              {editingIndex === index ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setTurfHistory((prev) =>
                      prev.map((poly, i) =>
                        i === index ? { ...poly, name: editText } : poly,
                      ),
                    );
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
                    <div>
                      {polygon.name || `Area: ${polygon.area.toFixed(2)}m²`}
                    </div>
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
                const polygon = turfHistory[contextMenuIndex];
                setEditText(
                  polygon.name || `Area: ${polygon.area.toFixed(2)}m²`,
                );
                setEditingIndex(contextMenuIndex);
                setEditingPolygon(polygon);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setTurfHistory((prev) =>
                  prev.filter((_, i) => i !== contextMenuIndex),
                );
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
