import { useState } from "react";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import { PointFeature } from "@/types";

interface GEOJSONPoint {
  properties: Record<string, number | string>;
  geometry: {
    coordinates: [number, number];
  };
}

interface MemberListProps {
  dataSource:
    | { name: string; markers: { features: PointFeature[] } }
    | undefined;
  onSelect: (coordinates: [number, number]) => void;
  showMembers: boolean;
}

export default function MemberList({
  dataSource,
  onSelect,
  showMembers,
}: MemberListProps) {
  const [limit, setLimit] = useState(10);

  if (!dataSource) return null;

  const hasMore = limit < dataSource.markers.features.length;

  return (
    <ScrollArea className="max-h-[200px] w-full rounded-md p-2 overflow-y-auto">
      <ul className={`${showMembers ? "opacity-100" : "opacity-50"}`}>
        {dataSource.markers.features
          ?.slice(0, limit)
          .map((feature: GEOJSONPoint) => (
            <li
              key={feature.properties[MARKER_ID_KEY]}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => onSelect(feature.geometry.coordinates)}
            >
              <span className="text-sm">
                {feature.properties[MARKER_NAME_KEY] || "Unnamed"}
              </span>
            </li>
          ))}
        {hasMore && (
          <li>
            <button
              type="button"
              onClick={() => setLimit(limit + 10)}
              className="w-full cursor-pointer hover:bg-gray-100 p-2 text-sm text-left"
            >
              Load more
            </button>
          </li>
        )}
        {(!dataSource.markers.features ||
          dataSource.markers.features.length === 0) && (
          <li className="text-sm text-muted-foreground p-2">
            No members found - check your settings
          </li>
        )}
      </ul>
    </ScrollArea>
  );
}
