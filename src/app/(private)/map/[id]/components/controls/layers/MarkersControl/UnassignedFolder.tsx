import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { Folder, PlacedMarker } from "@/__generated__/types";
import { Separator } from "@/shadcn/ui/separator";
import SortableMarkerItem from "./SortableMarkerItem";
import { sortByPositionAndId } from "./utils";

// Unassigned folder component (behaves like a regular folder)
export default function UnassignedFolder({
  markers,
  activeId,
  folders,
  setKeyboardCapture,
}: {
  markers: PlacedMarker[];
  activeId: string | null;
  folders: Folder[];
  setKeyboardCapture: (isEditing: boolean) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: "unassigned",
  });

  const sortedMarkers = useMemo(() => {
    return sortByPositionAndId(markers);
  }, [markers]);

  return (
    <div className="mb-1">
      {folders.length > 0 && (
        <div ref={setNodeRef} className="p-2">
          <Separator orientation="horizontal" className="h-4 w-full" />
        </div>
      )}

      <div className="ml-4 mt-1 space-y-0.5">
        <SortableContext
          items={sortedMarkers.map((marker) => `marker-${marker.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {sortedMarkers.map((marker, index) => (
            <SortableMarkerItem
              key={`${marker.id}-${index}`}
              marker={marker}
              activeId={activeId}
              setKeyboardCapture={setKeyboardCapture}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
