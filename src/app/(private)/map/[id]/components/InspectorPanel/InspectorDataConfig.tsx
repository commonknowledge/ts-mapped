import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDataSources } from "@/hooks/useDataSources";
import { useViewId } from "../../hooks/useMapViews";
import { useUpdateInspectorConfig } from "../../hooks/useUpdateInspectorConfig";
import { useViewInspectorConfig } from "../../hooks/useViewInspectorConfig";
import DataSourceSelectButton from "../DataSourceSelectButton";
import { InspectorConfigItem } from "./InspectorConfigItem";
import { deriveInspectorItems } from "./utils";

export default function InspectorDataConfig() {
  const viewId = useViewId();
  const inspectorConfigs = useViewInspectorConfig();
  const updateInspectorConfig = useUpdateInspectorConfig();
  const { getDataSourceById } = useDataSources();

  const moveDataSourceConfig = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= inspectorConfigs.length) return;
      if (fromIndex === toIndex) return;

      updateInspectorConfig((configs) => {
        const next = [...configs];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [inspectorConfigs.length, updateInspectorConfig],
  );

  const addDataSourceToConfig = useCallback(
    (dataSourceId: string) => {
      if (!viewId) {
        return;
      }

      const dataSource = getDataSourceById(dataSourceId);
      const derivedItems = deriveInspectorItems(
        dataSource?.columnDefs ?? [],
        dataSource?.columnMetadata ?? [],
      );
      const derivedLayout = derivedItems.length > 4 ? "twoColumn" : null;

      updateInspectorConfig((configs) => [
        ...configs,
        {
          id: uuidv4(),
          dataSourceId,
          mapViewId: viewId,
          position: configs.length,
          name: dataSource?.name || "Data Source",
          description: null,
          icon: null,
          screenshotUrl: null,
          color: null,
          items: derivedItems,
          layout: derivedLayout,
          ...dataSource?.defaultInspectorConfig,
        },
      ]);
    },
    [getDataSourceById, updateInspectorConfig, viewId],
  );

  return (
    <div className="flex flex-col gap-4">
      {inspectorConfigs.map((inspectorConfig, index) => (
        <InspectorConfigItem
          key={inspectorConfig.id}
          config={inspectorConfig}
          canMoveUp={index > 0}
          canMoveDown={index < inspectorConfigs.length - 1}
          onMoveUp={() => moveDataSourceConfig(index, index - 1)}
          onMoveDown={() => moveDataSourceConfig(index, index + 1)}
          onClickRemove={() => {
            updateInspectorConfig((configs) =>
              configs.filter((c) => c.id !== inspectorConfig.id),
            );
          }}
          onUpdate={(updatedConfig) => {
            updateInspectorConfig((configs) =>
              configs.map((c) =>
                c.id === inspectorConfig.id ? updatedConfig : c,
              ),
            );
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
