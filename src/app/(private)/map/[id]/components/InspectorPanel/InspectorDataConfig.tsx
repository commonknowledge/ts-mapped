import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDataSources } from "@/hooks/useDataSources";
import { type InspectorDataSourceConfig } from "@/models/MapView";
import { useMapViews } from "../../hooks/useMapViews";
import DataSourceSelectButton from "../DataSourceSelectButton";
import { BoundaryConfigItem } from "./BoundaryConfigItem";

export default function InspectorConfigTab() {
  const { view, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();

  const dataSourcesConfig = useMemo(
    () => view?.inspectorConfig?.dataSources || [],
    [view?.inspectorConfig?.dataSources],
  );

  const moveDataSourceConfig = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!view) return;
      if (toIndex < 0 || toIndex >= dataSourcesConfig.length) return;
      if (fromIndex === toIndex) return;

      const next = [...dataSourcesConfig];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          dataSources: next,
        },
      });
    },
    [dataSourcesConfig, updateView, view],
  );

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
        items: [],
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
          canMoveUp={index > 0}
          canMoveDown={index < dataSourcesConfig.length - 1}
          onMoveUp={() => moveDataSourceConfig(index, index - 1)}
          onMoveDown={() => moveDataSourceConfig(index, index + 1)}
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
        modalTitle="Select data source for inspector"
      />
    </div>
  );
}
