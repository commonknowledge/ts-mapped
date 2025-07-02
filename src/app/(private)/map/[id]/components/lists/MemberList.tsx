import { useContext, useState } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import SkeletonGroup from "../SkeletonGroup";

interface GEOJSONPoint {
  properties: Record<string, number | string>;
  geometry: {
    coordinates: [number, number];
  };
}

export default function MemberList() {
  const [limit, setLimit] = useState(10);

  const { mapRef, markersQuery, viewConfig } = useContext(MapContext);
  const dataSource = markersQuery?.data?.dataSource;

  if (markersQuery?.loading) {
    return <SkeletonGroup />;
  }

  if (!dataSource) {
    return null;
  }

  const hasMore = limit < dataSource.markers.features.length;

  return (
    <ScrollArea className="max-h-[200px] w-full rounded-md p-2 overflow-y-auto">
      <ul
        className={`${viewConfig.showMembers ? "opacity-100" : "opacity-50"}`}
      >
        {dataSource.markers.features
          ?.slice(0, limit)
          .map((feature: GEOJSONPoint) => (
            <li
              key={feature.properties[MARKER_ID_KEY]}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => {
                const map = mapRef?.current;
                if (map) {
                  map.flyTo({
                    center: feature.geometry.coordinates,
                    zoom: 12,
                  });
                }
              }}
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
