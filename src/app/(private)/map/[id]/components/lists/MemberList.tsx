import { Table } from "lucide-react";
import { useContext } from "react";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import DataSourceIcon from "../DataSourceIcon";

export default function MemberList() {
  const { viewConfig } = useContext(MapContext);
  const { getMembersDataSource } = useContext(DataSourcesContext);

  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);

  const dataSource = getMembersDataSource();

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
            className={`text-sm cursor-pointer p-2 rounded hover:bg-neutral-100 transition-colors flex items-center justify-between gap-2 ${
              isSelected ? "bg-neutral-100" : ""
            }`}
            onClick={() => handleDataSourceSelect(dataSource.id)}
          >
            <div className="flex items-center gap-2">
              <DataSourceIcon type={dataSource.config.type} />
              {dataSource.name}
            </div>
            {isSelected && <Table className="w-4 h-4 text-neutral-500" />}
          </div>
        ) : (
          <div>Add Member Data Source</div>
        )}
      </ul>
    </ScrollArea>
  );
}
