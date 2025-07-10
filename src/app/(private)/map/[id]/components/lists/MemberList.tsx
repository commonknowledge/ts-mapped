import { useContext, useState } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import SkeletonGroup from "../SkeletonGroup";
import { Table } from "lucide-react";
import DataSourceIcon from "../DataSourceIcon";

interface GEOJSONPoint {
  properties: Record<string, number | string>;
  geometry: {
    coordinates: [number, number];
  };
}

export default function MemberList() {
  const [limit, setLimit] = useState(10);

  const { mapRef, dataRecordsQuery, viewConfig, selectedDataSourceId, handleDataSourceSelect } = useContext(MapContext);
  const dataSource = dataRecordsQuery?.data?.dataSource;

  if (dataRecordsQuery?.loading) {
    return <SkeletonGroup />;
  }

  if (!dataSource) {
    return null;
  }

  const isSelected = selectedDataSourceId === dataSource.id;


  return (
    <ScrollArea className="max-h-[200px] w-full rounded-md  overflow-y-auto">
      <ul
        className={`${viewConfig.showMembers ? "opacity-100" : "opacity-50"}`}
      >
        {dataSource ? (
          <div 
            className={`text-sm cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-between gap-2 ${
              isSelected ? 'bg-neutral-100' : ''
            }`}
            onClick={() => handleDataSourceSelect(dataSource.id)}
          >
            <div className="flex items-center gap-2">
              <DataSourceIcon type={dataSource.config.type} />
              {dataSource.name}
            </div>
            {isSelected && (
          
              <Table className="w-4 h-4 text-neutral-500" />
            )}
          </div>
        ) : (
          <div>Add Member DataSource</div>
        )}
      </ul>
    </ScrollArea>
  );
}
