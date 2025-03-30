import { Button } from "@/shadcn/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { Input } from "@/shadcn/ui/input";
import { DrawnPolygon } from "@/types";
import * as turf from "@turf/turf";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TurfListProps {
  polygons: DrawnPolygon[];
  onSelect?: (coordinates: [number, number]) => void;
  onEdit?: (index: number, newName: string) => void;
  onDelete?: (index: number) => void;
  showTurf: boolean;
  editingPolygon: DrawnPolygon | null;
  setEditingPolygon: (polygon: DrawnPolygon | null) => void;
}

export default function TurfList({
  polygons,
  onSelect,
  onEdit,
  onDelete,
  showTurf,
  editingPolygon,
  setEditingPolygon,
}: TurfListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
  const [formattedDates, setFormattedDates] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    // Format dates only on client-side
    const dates = polygons.reduce(
      (acc, polygon) => {
        acc[polygon.id] = new Date(polygon.timestamp)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        return acc;
      },
      {} as { [key: string]: string }
    );

    setFormattedDates(dates);
  }, [polygons]);

  const handleFlyTo = (polygon: DrawnPolygon) => {
    if (onSelect) {
      // Calculate the center of the polygon using turf.js
      const center = turf.center(polygon.geometry);
      onSelect(center.geometry.coordinates as [number, number]);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <ul className={`${showTurf ? "opacity-100" : "opacity-50"}`}>
          {polygons.map((polygon, index) => (
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
                    onEdit?.(index, editText);
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
                const polygon = polygons[contextMenuIndex];
                setEditText(
                  polygon.name || `Area: ${polygon.area.toFixed(2)}m²`
                );
                setEditingIndex(contextMenuIndex);
                setEditingPolygon(polygon);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onDelete?.(contextMenuIndex)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
