import { DatabaseIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { usePrivateMapStore } from "@/app/map/[id]/stores/usePrivateMapStore";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { LayerType } from "@/types";
import { mapColors } from "../../../styles";
import { CollectionIcon } from "../../Icons";
import DataSourceControl from "../DataSourceItem";
import LayerControlWrapper from "../LayerControlWrapper";
import EmptyLayer from "../LayerEmptyMessage";
import LayerHeader from "../LayerHeader";

export default function MembersControl() {
  const router = useRouter();
  const { updateMapConfig } = useMapConfig();
  const dataSource = useMembersDataSource();
  const { data: allDataSources, isPending: allDataSourcesLoading } =
    useDataSources();
  const selectedDataSourceId = usePrivateMapStore(
    (s) => s.selectedDataSourceId,
  );
  const toggleDataSourceId = usePrivateMapStore((s) => s.toggleDataSourceId);
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
          toggleDataSourceId(ds.id);
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
    <LayerControlWrapper>
      <LayerHeader
        label="Members"
        type={LayerType.Member}
        expanded={expanded}
        setExpanded={setExpanded}
      >
        <IconButtonWithTooltip
          align="start"
          side="right"
          tooltip="Select a member collection"
          dropdownLabel="Select a member collection"
          dropdownItems={getDropdownItems()}
        >
          <DatabaseIcon size={16} />
        </IconButtonWithTooltip>
      </LayerHeader>

      {expanded && (
        <div className="pt-2">
          {allDataSourcesLoading ? null : dataSource ? (
            <DataSourceControl
              dataSource={dataSource}
              isSelected={isSelected}
              handleDataSourceSelect={toggleDataSourceId}
              layerType={LayerType.Member}
            />
          ) : (
            <EmptyLayer
              message={
                <p className="flex  items-center gap-2">
                  Add a{" "}
                  <span className="text-sm  flex items-center gap-1">
                    <CollectionIcon color={mapColors.member.color} /> Member
                    Collection
                  </span>
                </p>
              }
            />
          )}
        </div>
      )}
    </LayerControlWrapper>
  );
}
