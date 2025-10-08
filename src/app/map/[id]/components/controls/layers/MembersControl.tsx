import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import {
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { mapColors } from "../../../styles";
import { CollectionIcon } from "../../Icons";
import CollectionLayer from "../CollectionLayer";
import ControlItemWrapper from "../ControlItemWrapper";
import EmptyLayer from "../Emptylayer";
import LayerHeader from "../LayerHeader";

export default function MembersControl() {
  const router = useRouter();
  const { updateMapConfig, viewConfig, updateViewConfig } =
    useContext(MapContext);
  const dataSource = useMembersDataSource();
  const { dataSources: allDataSources } = useDataSources();
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const [expanded, setExpanded] = useState(true);

  const isSelected = dataSource
    ? selectedDataSourceId === dataSource.id
    : false;

  const dataSources = allDataSources.filter((dataSource) => {
    return dataSource.recordType === DataSourceRecordType.Members;
  });

  const getDropdownItems = () => {
    const items = dataSources.map((ds) => ({
      type: "item" as const,
      label: ds.name,
      onClick: () => {
        handleDataSourceSelect(ds.id);
        updateMapConfig({ membersDataSourceId: ds.id });
      },
    }));
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
    <ControlItemWrapper>
      <LayerHeader
        label="Members"
        color={mapColors.member.color}
        showLayer={viewConfig.showMembers}
        setLayer={(show) => updateViewConfig({ showMembers: show })}
        expanded={expanded}
        setExpanded={setExpanded}
      >
        <IconButtonWithTooltip
          align="start"
          side="right"
          tooltip="Member lists"
          dropdownLabel="Select a member collection"
          dropdownItems={getDropdownItems()}
        >
          <Ellipsis className="w-4 h-4" />
        </IconButtonWithTooltip>
      </LayerHeader>

      {expanded && (
        <ul
          className={`${viewConfig.showMembers ? "opacity-100" : "opacity-50"}`}
        >
          {dataSource ? (
            <CollectionLayer
              dataSource={dataSource}
              isSelected={isSelected}
              onClick={() => handleDataSourceSelect(dataSource.id)}
              handleDataSourceSelect={handleDataSourceSelect}
              layerType="member"
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
        </ul>
      )}
    </ControlItemWrapper>
  );
}
