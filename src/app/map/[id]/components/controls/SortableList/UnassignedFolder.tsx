import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { sortByPositionAndId } from "@/app/map/[id]/utils/position";
import SortableMarkerItem from "../MarkersControl/SortableMarkerItem";
import SortableTurfItem from "../TurfsControl/SortableTurfItem";
import type { Folder } from "@/server/models/Folder";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { Turf } from "@/server/models/Turf";

// Unassigned folder component (behaves like a regular folder)
export default function UnassignedFolder({
  markers = [],
  turfs = [],
  activeId,
  folders,
  setKeyboardCapture,
}: {
  markers?: PlacedMarker[];
  turfs?: Turf[];
  activeId: string | null;
  folders: Folder[];
  setKeyboardCapture: (isEditing: boolean) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: "unassigned",
  });

  const sortedItems = useMemo(() => {
    const items: (PlacedMarker | Turf)[] = markers;
    return sortByPositionAndId(items.concat(turfs));
  }, [markers, turfs]);

  return (
    <div className="mb-3 flex flex-col gap-1">
      {folders.length > 0 && <div ref={setNodeRef} />}

      <SortableContext
        items={sortedItems.map((item) => `item-${item.id}`)}
        strategy={verticalListSortingStrategy}
      >
        {sortedItems.map((item, index) =>
          "polygon" in item ? (
            <SortableTurfItem
              key={`${item.id}-${index}`}
              turf={item}
              activeId={activeId}
              setKeyboardCapture={setKeyboardCapture}
            />
          ) : (
            <SortableMarkerItem
              key={`${item.id}-${index}`}
              marker={item}
              activeId={activeId}
              setKeyboardCapture={setKeyboardCapture}
            />
          ),
        )}
      </SortableContext>
    </div>
  );
}
