import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type InspectorBoundaryConfig,
  InspectorBoundaryConfigType,
} from "@/server/models/MapView";
import { useDataSources } from "../../hooks/useDataSources";
import { useInspector } from "../../hooks/useInspector";
import { useMapViews } from "../../hooks/useMapViews";
import DataSourceSelectButton from "../DataSourceSelectButton";
import TogglePanel from "../TogglePanel";
import { BoundaryConfigItem } from "./BoundaryConfigItem";

export default function InspectorConfigTab() {
  const { view, viewConfig, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { selectedBoundary } = useInspector();

  const boundaryStatsConfig = view?.inspectorConfig?.boundaries || [];
  const initializationAttemptedRef = useRef(false);
  const areaSetCode = selectedBoundary?.areaSetCode;

  const addDataSourceToConfig = useCallback(
    (dataSourceId: string) => {
      if (!view) {
        return;
      }

      const dataSource = getDataSourceById(dataSourceId);
      const newBoundaryConfig: InspectorBoundaryConfig = {
        id: uuidv4(),
        dataSourceId,
        name: dataSource?.name || "Boundary Data",
        type: InspectorBoundaryConfigType.Simple,
        columns: [],
      };

      const prevBoundaries = view.inspectorConfig?.boundaries || [];

      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          boundaries: [...prevBoundaries, newBoundaryConfig],
        },
      });
    },
    [getDataSourceById, updateView, view],
  );

  // Initialize boundaries with areaDataSourceId if empty
  useEffect(() => {
    if (!view || initializationAttemptedRef.current) return;

    const hasBoundaries = boundaryStatsConfig.length > 0;
    const hasAreaDataSource = viewConfig.areaDataSourceId;

    if (!hasBoundaries && hasAreaDataSource) {
      initializationAttemptedRef.current = true;
      addDataSourceToConfig(viewConfig.areaDataSourceId);
    }
  }, [
    view,
    viewConfig.areaDataSourceId,
    boundaryStatsConfig.length,
    getDataSourceById,
    updateView,
    addDataSourceToConfig,
  ]);

  return (
    <div className="flex flex-col">
      <TogglePanel label="Data display configuration" defaultExpanded={true}>
        <div className="flex flex-col gap-4 pt-4">
          {boundaryStatsConfig.map((boundaryConfig, index) => (
            <BoundaryConfigItem
              key={boundaryConfig.id}
              areaSetCode={areaSetCode}
              boundaryConfig={boundaryConfig}
              index={index}
              onClickRemove={() => {
                if (!view) return;
                const updatedBoundaries =
                  view.inspectorConfig?.boundaries?.filter(
                    (_, i) => i !== index,
                  );
                updateView({
                  ...view,
                  inspectorConfig: {
                    ...view.inspectorConfig,
                    boundaries: updatedBoundaries,
                  },
                });
              }}
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
          <DataSourceSelectButton
            className="w-full"
            areaSetCode={areaSetCode}
            onSelect={(dataSourceId) => addDataSourceToConfig(dataSourceId)}
            selectButtonText={"Add a data source"}
          />
        </div>
      </TogglePanel>
    </div>
  );
}
