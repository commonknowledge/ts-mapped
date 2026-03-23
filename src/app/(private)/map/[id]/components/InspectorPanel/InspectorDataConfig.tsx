import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { type InspectorDataSourceConfig } from "@/models/MapView";
import { useDataSources } from "../../hooks/useDataSources";
import { useMapViews } from "../../hooks/useMapViews";
import DataSourceSelectButton from "../DataSourceSelectButton";
import { BoundaryConfigItem } from "./BoundaryConfigItem";

export default function InspectorConfigTab() {
  const { view, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();

  const dataSourcesConfig = view?.inspectorConfig?.dataSources || [];

  const addDataSourceToConfig = useCallback(
    (dataSourceId: string) => {
      if (!view) {
        return;
      }

      const dataSource = getDataSourceById(dataSourceId);
      const newDataSourceConfig: InspectorDataSourceConfig = {
        id: uuidv4(),
        dataSourceId,
        name: dataSource?.name || "Data Source",
        columns: [],
      };

      const prevDataSources = view.inspectorConfig?.dataSources || [];

      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          dataSources: [...prevDataSources, newDataSourceConfig],
        },
      });
    },
    [getDataSourceById, updateView, view],
  );

  return (
    <div className="flex flex-col gap-4">
      {dataSourcesConfig.map((dataSourceConfig, index) => (
        <BoundaryConfigItem
          key={dataSourceConfig.id}
          boundaryConfig={dataSourceConfig}
          index={index}
          onClickRemove={() => {
            if (!view) return;
            const updatedDataSources =
              view.inspectorConfig?.dataSources?.filter((_, i) => i !== index);
            updateView({
              ...view,
              inspectorConfig: {
                ...view.inspectorConfig,
                dataSources: updatedDataSources,
              },
            });
          }}
          onUpdate={(updatedConfig) => {
            if (!view) return;
            const updatedDataSources = [...dataSourcesConfig];
            updatedDataSources[index] = updatedConfig;
            updateView({
              ...view,
              inspectorConfig: {
                ...view.inspectorConfig,
                dataSources: updatedDataSources,
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
