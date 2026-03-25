import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { type InspectorBoundaryConfig } from "@/models/MapView";
import { useDataSources } from "../../hooks/useDataSources";
import { useMapViews } from "../../hooks/useMapViews";
import DataSourceSelectButton from "../DataSourceSelectButton";
import { BoundaryConfigItem } from "./BoundaryConfigItem";

export default function InspectorConfigTab() {
  const { view, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();

  const boundaryStatsConfig = view?.inspectorConfig?.boundaries || [];

  const addDataSourceToConfig = useCallback(
    (dataSourceId: string) => {
      if (!view) {
        return;
      }

      const dataSource = getDataSourceById(dataSourceId);
      const defaults = dataSource?.defaultInspectorConfig;
      const newBoundaryConfig: InspectorBoundaryConfig = {
        id: uuidv4(),
        dataSourceId,
        name: defaults?.name ?? dataSource?.name ?? "Boundary Data",
        columns: defaults?.columns ?? [],
        ...(defaults?.columnOrder != null && {
          columnOrder: defaults.columnOrder,
        }),
        ...(defaults?.columnItems != null && {
          columnItems: defaults.columnItems,
        }),
        ...(defaults?.columnMetadata != null && {
          columnMetadata: defaults.columnMetadata,
        }),
        ...(defaults?.columnGroups != null && {
          columnGroups: defaults.columnGroups,
        }),
        ...(defaults?.layout != null && { layout: defaults.layout }),
        ...(defaults?.icon != null && { icon: defaults.icon }),
        ...(defaults?.color != null && { color: defaults.color }),
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

  return (
    <div className="flex flex-col gap-4">
      {boundaryStatsConfig.map((boundaryConfig, index) => (
        <BoundaryConfigItem
          key={boundaryConfig.id}
          boundaryConfig={boundaryConfig}
          index={index}
          onClickRemove={() => {
            if (!view) return;
            const updatedBoundaries = view.inspectorConfig?.boundaries?.filter(
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
        onSelect={(dataSourceId) => addDataSourceToConfig(dataSourceId)}
        selectButtonText={"Add a data source"}
      />
    </div>
  );
}
