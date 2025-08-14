import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { Folder, PlacedMarker } from "@/__generated__/types";
import { sortByPositionAndId } from "@/app/(private)/map/[id]/utils";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import SortableMarkerItem from "./SortableMarkerItem";

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
    <div className="mb-3">
      {folders.length > 0 && (
        <div ref={setNodeRef} className="px-1 py-1">
          {/* <Separator orientation="horizontal" className="h-4 w-full" /> */}
        </div>
      )}

      <div
        className={cn("mt-1 space-y-0.5 ml-1")}
      >
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
