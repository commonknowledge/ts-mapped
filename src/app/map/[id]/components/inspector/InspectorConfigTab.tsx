import { useEffect } from "react";
import {
  type InspectorBoundaryConfig,
  InspectorBoundaryConfigType,
} from "@/server/models/MapView";
import { useDataSources } from "../../hooks/useDataSources";
import { useMapViews } from "../../hooks/useMapViews";
import TogglePanel from "../TogglePanel";
import { BoundaryConfigItem } from "./BoundaryConfigItem";

export default function InspectorConfigTab() {
  const { view, viewConfig, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const boundaryStatsConfig = view?.inspectorConfig?.boundaries || [];

  // Initialize boundaries with areaDataSourceId if empty
  useEffect(() => {
    if (!view) return;

    const hasBoundaries = boundaryStatsConfig.length > 0;
    const hasAreaDataSource = viewConfig.areaDataSourceId;

    if (!hasBoundaries && hasAreaDataSource) {
      const dataSource = getDataSourceById(viewConfig.areaDataSourceId);
      const newBoundaryConfig: InspectorBoundaryConfig = {
        dataSourceId: viewConfig.areaDataSourceId,
        name: dataSource?.name || "Boundary Data",
        type: InspectorBoundaryConfigType.Simple,
        columns: [],
      };

      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          boundaries: [newBoundaryConfig],
        },
      });
    }
  }, [
    view,
    viewConfig.areaDataSourceId,
    boundaryStatsConfig.length,
    updateView,
    getDataSourceById,
  ]);

  return (
    <div className="flex flex-col">
      <TogglePanel label="Data display configuration" defaultExpanded={true}>
        <div className="flex flex-col gap-4">
          {boundaryStatsConfig.map((boundaryConfig, index) => (
            <BoundaryConfigItem
              key={boundaryConfig.dataSourceId}
              boundaryConfig={boundaryConfig}
              index={index}
              onUpdate={(updatedConfig) => {
                if (!view) return;
                const updatedBoundaries = [...boundaryStatsConfig];
                updatedBoundaries[index] = updatedConfig;
                updateView({
                  ...view,
                  inspectorConfig: {
                    ...view.inspectorConfig,
                    boundaries: updatedBoundaries,
                  },
                });
              }}
            />
          ))}
        </div>
      </TogglePanel>
    </div>
  );
}
