import { ChevronDown, ChevronRight, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import {
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import DataSourceIcon from "@/components/DataSourceIcon";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { cn } from "@/shadcn/utils";
import { mapColors } from "../../../styles";
import { CollectionIcon } from "../../Icons";
import EmptyLayer from "../Emptylayer";
import LayerItem from "../LayerItem";
import { defaultLayerStyles } from "../LayerStyles";

export default function MembersControl() {
  const router = useRouter();
  const { updateMapConfig } = useMapConfig();
  const dataSource = useMembersDataSource();
  const { data: allDataSources, isPending: allDataSourcesLoading } =
    useDataSources();
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const [expanded, setExpanded] = useState(true);

  const isSelected = dataSource
    ? selectedDataSourceId === dataSource.id
    : false;

  const dataSources = allDataSources?.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Members;
  });

  const getDropdownItems = () => {
    const items =
      dataSources?.map((ds) => ({
        type: "item" as const,
        label: ds.name,
        onClick: () => {
          handleDataSourceSelect(ds.id);
          updateMapConfig({ membersDataSourceId: ds.id });
        },
      })) || [];
    return [
      ...items,
      ...(items.length > 0 ? [{ type: "separator" as const }] : []),
      {
        type: "item" as const,
        label: "Add new data source",
        onClick: () => router.push("/data-sources/new"),
      },
    ];
  };

  return (
    <div className={defaultLayerStyles.container}>
      {/* Header */}
      <div className={defaultLayerStyles.header}>
        <button
          className="flex items-center gap-2 hover:bg-neutral-100 rounded p-1 -m-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          )}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: mapColors.member.color }}
          />
          <span className="text-sm font-medium">Members</span>
        </button>
        <div className="flex items-center gap-1">
          <IconButtonWithTooltip
            align="start"
            side="right"
            tooltip="Refresh members"
            dropdownLabel="Select a member collection"
            dropdownItems={getDropdownItems()}
          >
            <Database className="w-4 h-4" />
          </IconButtonWithTooltip>
        </div>
      </div>

      {/* Layer Items */}
      {expanded && (
        <div className={cn(defaultLayerStyles.content, "space-y-1")}>
          {allDataSourcesLoading ? (
            <div className="flex items-center gap-2 p-2 bg-white rounded border">
              <div className="text-sm text-neutral-500">Loading...</div>
            </div>
          ) : dataSource ? (
            <LayerItem
              onClick={() => handleDataSourceSelect(dataSource.id)}
              layerType="members"
              className={isSelected ? "ring-2 ring-blue-500" : ""}
              isDataSource={true}
            >
              <DataSourceIcon type={dataSource.config.type} />
              <div className="flex-1">
                <div className="text-sm font-medium">{dataSource.name}</div>
                <div className="text-xs text-neutral-500">
                  {dataSource.recordCount?.toLocaleString() || "0"} records
                  {dataSource.createdAt &&
                    ` • Created ${new Date(dataSource.createdAt).toLocaleDateString()}`}
                </div>
              </div>
            </LayerItem>
          ) : (
            <EmptyLayer
              message={
                <p className="flex items-center gap-2">
                  Add a{" "}
                  <span className="text-sm flex items-center gap-1">
                    <CollectionIcon color={mapColors.member.color} /> Member
                    Collection
                  </span>
                </p>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
