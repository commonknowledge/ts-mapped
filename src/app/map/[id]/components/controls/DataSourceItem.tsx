import DataSourceIcon from "@/components/DataSourceIcon";
import { LayerType } from "@/types";
import { usePrivateMapStore } from "../../stores/usePrivateMapStore";
import { mapColors } from "../../styles";
import ControlWrapper from "./ControlWrapper";
import type { DataSourceType } from "@/server/models/DataSource";

export default function DataSourceItem({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
}: {
  dataSource: {
    id: string;
    name: string;
    config: { type: DataSourceType };
    recordCount?: number;
    createdAt?: Date;
  };
  isSelected: boolean;
  handleDataSourceSelect: (id: string) => void;
  layerType: LayerType;
}) {
  const setDataSourceVisibilityState = usePrivateMapStore(
    (s) => s.setDataSourceVisibilityState,
  );
  const getDataSourceVisibility = usePrivateMapStore(
    (s) => s.getDataSourceVisibility,
  );
  const layerColor =
    layerType === LayerType.Member
      ? mapColors.member.color
      : mapColors.markers.color;

  const isVisible = getDataSourceVisibility(dataSource?.id);

  return (
    <ControlWrapper
      name={dataSource.name}
      layerType={layerType}
      isVisible={isVisible}
      onVisibilityToggle={() =>
        setDataSourceVisibilityState(dataSource?.id, !isVisible)
      }
    >
      <button
        className="flex w-full items-center justify-between gap-2 min-h-full cursor-pointer hover:bg-neutral-100 border-2 rounded"
        style={{ borderColor: isSelected ? layerColor : "transparent" }}
        onClick={() => handleDataSourceSelect(dataSource.id)}
      >
        <div className="flex gap-[6px] text-left">
          <div className="shrink-0 mt-[0.333em]">
            <DataSourceIcon type={dataSource.config.type} />
          </div>

          <div>
            <span className="text-sm font-medium">{dataSource.name}</span>
            <div className="text-xs text-muted-foreground">
              {Boolean(dataSource?.recordCount) ? (
                <p>{dataSource.recordCount} records</p>
              ) : (
                <p>No records</p>
              )}
              {dataSource.createdAt && (
                <p>
                  Created {new Date(dataSource?.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </button>
    </ControlWrapper>
  );
}
