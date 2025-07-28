import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Folder as FolderClosed, FolderOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { Folder, PlacedMarker } from "@/__generated__/types";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { cn } from "@/shadcn/utils";
import SortableMarkerItem from "./SortableMarkerItem";
import { sortByPositionAndId } from "./utils";

// Folder component
export default function FolderItem({
  folder,
  markers,
  activeId,
  isPulsing,
  setKeyboardCapture,
}: {
  folder: Folder;
  markers: PlacedMarker[];
  activeId: string | null;
  isPulsing: boolean;
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
    <div>
      <div
        ref={setHeaderNodeRef}
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-neutral-100 rounded transition-colors ${
          isHeaderOver ? "bg-blue-50" : ""
        }`}
        onClick={() => setExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
        ) : (
          <FolderClosed className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium flex-1">{folder.name}</span>
        <span
          className={cn(
            "text-xs text-muted-foreground bg-transparent transition-transform duration-300",
            isPulsing ? "animate-pulse  transform scale-110" : "",
          )}
          style={{
            color: isPulsing ? mapColors.markers.color : "",
          }}
        >
          ({sortedMarkers.length})
        </span>
      </div>

      {isExpanded && (
        <>
          <div className="ml-3 mt-1 space-y-0.5">
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
