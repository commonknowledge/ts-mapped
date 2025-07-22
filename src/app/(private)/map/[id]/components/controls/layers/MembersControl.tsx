import { Table } from "lucide-react";
import { useContext } from "react";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import DataSourceIcon from "../../DataSourceIcon";
import SettingsModal from "../../SettingsModal";
import ControlItemWrapper from "../ControlItemWrapper";
import LayerHeader from "../LayerHeader";

export default function MembersControl() {
  const { viewConfig, updateViewConfig } = useContext(MapContext);
  const { getMembersDataSource } = useContext(DataSourcesContext);
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);

  const dataSource = getMembersDataSource();
  const isSelected = dataSource
    ? selectedDataSourceId === dataSource.id
    : false;

  return (
    <ControlItemWrapper>
      <LayerHeader
        label="Members"
        color={mapColors.member.color}
        showLayer={viewConfig.showMembers}
        setLayer={(show) => updateViewConfig({ showMembers: show })}
      >
        <SettingsModal />
      </LayerHeader>

      <ScrollArea className="max-h-[200px] w-full rounded-md overflow-y-auto">
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
            <div className="text-sm text-muted-foreground p-2">
              No member data source configured
            </div>
          )}
        </ul>
      </ScrollArea>
    </ControlItemWrapper>
  );
}
