import { Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { TableContext } from "@/components/Map/context/TableContext";
import { mapColors } from "@/components/Map/styles";
import { CollectionIcon } from "../../Icons";
import CollectionLayer from "../CollectionLayer";
import ControlItemWrapper from "../ControlItemWrapper";
import EmptyLayer from "../Emptylayer";
import LayerHeader from "../LayerHeader";

export default function MembersControl() {
  const router = useRouter();
  const { updateMapConfig, viewConfig, updateViewConfig } =
    useContext(MapContext);
  const { getMembersDataSource } = useContext(DataSourcesContext);
  const { selectedDataSourceId, handleDataSourceSelect } =
    useContext(TableContext);
  const { getDataSources } = useContext(DataSourcesContext);

  const dataSource = getMembersDataSource();
  const isSelected = dataSource
    ? selectedDataSourceId === dataSource.id
    : false;

  const dataSources = getDataSources();

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
    </ControlItemWrapper>
  );
}
