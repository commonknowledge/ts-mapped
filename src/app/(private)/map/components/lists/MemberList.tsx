import { MarkersQuery } from "@/__generated__/types";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { ScrollArea } from "@/shadcn/ui/scroll-area";

interface GEOJSONPoint {
  properties: Record<string, number | string>;
  geometry: {
    coordinates: [number, number];
  };
}

interface MemberListProps {
  dataSource: MarkersQuery["dataSource"] | undefined;
  onSelect: (coordinates: [number, number]) => void;
  showMembers: boolean;
}

export default function MemberList({
  dataSource,
  onSelect,
  showMembers,
}: MemberListProps) {
  if (!dataSource) return null;

  return (
    <ScrollArea className="max-h-[200px] w-full rounded-md  p-2 overflow-y-auto">
      <div className={`${showMembers ? "opacity-100" : "opacity-50"}`}>
        {dataSource?.markers.features?.map((feature: GEOJSONPoint) => (
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
        {(!dataSource.markers.features ||
          dataSource.markers.features.length === 0) && (
          <div className="text-sm text-muted-foreground p-2">
            No members found - check your settings
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
