import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Folder, PlacedMarker } from "@/__generated__/types";
import SortableMarkerItem from "./SortableMarkerItem";
import { sortByPositionAndId } from "./utils";

// Folder component
export default function FolderItem({
  folder,
  markers,
  activeId,
  setKeyboardCapture,
}: {
  folder: Folder;
  markers: PlacedMarker[];
  activeId: string | null;
  setKeyboardCapture: (captured: boolean) => void;
}) {
  const { setNodeRef: setHeaderNodeRef, isOver: isHeaderOver } = useDroppable({
    id: `folder-${folder.id}`,
  });

  const { setNodeRef: setFooterNodeRef } = useDroppable({
    id: `folder-footer-${folder.id}`,
  });

  const [isExpanded, setExpanded] = useState(false);

  const sortedMarkers = useMemo(() => {
    return sortByPositionAndId(markers);
  }, [markers]);

  return (
    <div className="mb-1">
      <div
        ref={setHeaderNodeRef}
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-neutral-100 rounded transition-colors ${
          isHeaderOver ? "bg-blue-50" : ""
        }`}
        onClick={() => setExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium flex-1">{folder.name}</span>
        <span className="text-xs text-muted-foreground">
          ({sortedMarkers.length})
        </span>
      </div>

      {isExpanded && (
        <>
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

          {/* Invisible footer drop zone */}
          <div ref={setFooterNodeRef} className={`h-2 ml-4 mt-1 rounded`} />
        </>
      )}
    </div>
  );
}
