import { useContext } from "react";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { LayerType } from "@/types";
import { mapColors } from "../../styles";
import LayerItemWrapper from "./LayerItemWrapper";
import type { DataSourceType } from "@/server/models/DataSource";

export default function DataSourceItem({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
}: {
  dataSource: { id: string; name: string; config: { type: DataSourceType } };
  isSelected: boolean;
  handleDataSourceSelect: (id: string) => void;
  layerType: LayerType;
}) {
  const { setDataSourceVisibilityState, getDataSourceVisibility } =
    useContext(MarkerAndTurfContext);
  const layerColor =
    layerType === LayerType.Member
      ? mapColors.member.color
      : mapColors.markers.color;

  const isVisible = getDataSourceVisibility(dataSource?.id);

  return (
    <LayerItemWrapper
      name={dataSource.name}
      layerType={layerType}
      isVisible={isVisible}
      onVisibilityToggle={() =>
        setDataSourceVisibilityState(dataSource?.id, !isVisible)
      }
    >
      <button
        className="flex w-full items-center justify-between gap-2 cursor-pointer hover:bg-neutral-100 border-2 rounded"
        style={{ borderColor: isSelected ? layerColor : "transparent" }}
        onClick={() => handleDataSourceSelect(dataSource.id)}
      >
        <div className="flex items-center gap-2 text-sm">
          <DataSourceIcon type={dataSource.config.type} />
          <span className="font-medium">{dataSource.name}</span>
        </div>
      </button>
    </LayerItemWrapper>
  );
}
