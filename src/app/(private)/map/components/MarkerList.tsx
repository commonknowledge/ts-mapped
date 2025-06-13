import { useState } from "react";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import { PointFeature } from "@/types";

interface MarkerListProps {
  dataSource:
    | { name: string; markers: { features: PointFeature[] } }
    | undefined;
  onSelect: (coordinates: [number, number]) => void;
}

export default function MarkerList({ dataSource, onSelect }: MarkerListProps) {
  const [limit, setLimit] = useState(100);
  if (!dataSource) {
    return null;
  }

  const features = dataSource?.markers?.features || [];
  const showMore = limit < features.length;

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border p-2">
      <div className="space-y-2">
        <ul className="space-y-2">
          {features
            .slice(0, limit)
            .map(
              (feature: {
                properties: Record<string, string>;
                geometry: { coordinates: [number, number] };
              }) => (
                <li
                  key={feature.properties[MARKER_ID_KEY]}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => onSelect(feature.geometry.coordinates)}
                >
                  <span className="text-sm">
                    {feature.properties?.[MARKER_NAME_KEY] || "Unnamed"}
                  </span>
                </li>
              ),
            )}
        </ul>
        {showMore && (
          <button
            className="w-full text-left p-2 hover:bg-gray-100 rounded cursor-pointer"
            type="button"
            onClick={() => setLimit(limit + 100)}
          >
            Show more
          </button>
        )}
        {features.length === 0 && (
          <span className="block p-2 text-sm text-muted-foreground">
            No markers found in {dataSource.name} data source
          </span>
        )}
      </div>
    </ScrollArea>
  );
}
