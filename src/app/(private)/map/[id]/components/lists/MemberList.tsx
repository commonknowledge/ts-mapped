import { useContext, useState } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import SkeletonGroup from "../SkeletonGroup";

export default function MemberList() {
  const [limit, setLimit] = useState(10);

  const { mapRef, dataRecordsQuery, viewConfig } = useContext(MapContext);
  const dataSource = dataRecordsQuery?.data?.dataSource;

  if (dataRecordsQuery?.loading) {
    return <SkeletonGroup />;
  }

  if (!dataSource) {
    return null;
  }

  const hasMore = limit < (dataSource.records?.length || 0);

  return (
    <ScrollArea className="max-h-[200px] w-full rounded-md p-2 overflow-y-auto">
      <ul
        className={`${viewConfig.showMembers ? "opacity-100" : "opacity-50"}`}
      >
        {dataSource.records?.slice(0, limit).map((record) => (
          <li
            key={record.externalId}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
            onClick={() => {
              const map = mapRef?.current;
              if (map && record.geocodePoint) {
                map.flyTo({
                  center: record.geocodePoint,
                  zoom: 12,
                });
              }
            }}
          >
            <span className="text-sm">{record.externalId}</span>
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
        {(!dataSource.records || dataSource.records.length === 0) && (
          <li className="text-sm text-muted-foreground p-2">
            No members found - check your settings
          </li>
        )}
      </ul>
    </ScrollArea>
  );
}
