import { MarkersQuery } from "@/__generated__/types";
import { ScrollArea } from "@/shadcn/ui/scroll-area";

interface MemberListProps {
  members: MarkersQuery["markers"] | undefined;
  onSelect: (coordinates: [number, number]) => void;
}

export default function MemberList({
  members = [],
  onSelect,
}: MemberListProps) {
  if (!members) return null;
  return (
    <ScrollArea className="h-[200px] w-full rounded-md border p-2">
      <div className="space-y-2">
        {members.features?.map(
          (feature: {
            properties: Record<string, string>;
            geometry: { coordinates: [number, number] };
          }) => (
            <li
              key={feature.properties.Name}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => onSelect(feature.geometry.coordinates)}
            >
              <span className="text-sm">
                {feature.properties?.Name || "Unnamed"}
              </span>
            </li>
          ),
        )}
        {(!members.features || members.features.length === 0) && (
          <div className="text-sm text-muted-foreground p-2">
            No members found - check your settings
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
