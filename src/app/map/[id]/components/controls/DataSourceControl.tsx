import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useContext } from "react";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { mapColors } from "../../styles";
import type { DataSourceType } from "@/server/models/DataSource";

export default function DataSourceControl({
  dataSource,
  isSelected,
  handleDataSourceSelect,
  layerType,
}: {
  dataSource: { id: string; name: string; config: { type: DataSourceType } };
  isSelected: boolean;
  handleDataSourceSelect: (id: string) => void;
  layerType: string;
}) {
  const { setDataSourceVisibilityState, getDataSourceVisibility } =
    useContext(MarkerAndTurfContext);
  const layerColor =
    layerType === "member" ? mapColors.member.color : mapColors.markers.color;
  const isVisible = getDataSourceVisibility(dataSource?.id);

  return (
    <div className="flex">
      <button
        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-500 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-2 cursor-pointer"
        aria-label={`Toggle ${dataSource.name} visibility`}
        onClick={() => setDataSourceVisibilityState(dataSource?.id, !isVisible)}
      >
        {isVisible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
      </button>
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
    </div>
  );
}
