"use client";

import { useCallback, useState } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { useViewId } from "../../hooks/useMapViews";
import { useUpdateInspectorConfig } from "../../hooks/useUpdateInspectorConfig";
import { useViewInspectorConfig } from "../../hooks/useViewInspectorConfig";
import DataRecordsPanel from "./DataRecordsPanel";
import { InspectorConfigModal } from "./InspectorConfigModal";
import { buildDefaultInspectorConfig } from "./utils";
import type { DataRecord } from "@/models/DataRecord";

export default function ConfigurableDataRecordsPanel({
  dataSourceId,
  records,
  isLoading,
  defaultExpanded,
  hint,
}: {
  dataSourceId: string;
  records: DataRecord[];
  isLoading: boolean;
  defaultExpanded: boolean;
  hint?: string;
}) {
  const viewId = useViewId();
  const inspectorConfigs = useViewInspectorConfig();
  const updateInspectorConfig = useUpdateInspectorConfig();
  const { getDataSourceById } = useDataSources();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const config = inspectorConfigs.find((c) => c.dataSourceId === dataSourceId);

  const onClickConfigure = useCallback(() => {
    if (!viewId) return;

    if (!inspectorConfigs.some((c) => c.dataSourceId === dataSourceId)) {
      const dataSource = getDataSourceById(dataSourceId);
      updateInspectorConfig((configs) => [
        ...configs,
        buildDefaultInspectorConfig({
          dataSourceId,
          mapViewId: viewId,
          position: configs.length,
          dataSource: dataSource ?? undefined,
        }),
      ]);
    }

    setIsModalOpen(true);
  }, [
    viewId,
    inspectorConfigs,
    dataSourceId,
    getDataSourceById,
    updateInspectorConfig,
  ]);

  return (
    <>
      <DataRecordsPanel
        dataSourceId={dataSourceId}
        records={records}
        isLoading={isLoading}
        defaultExpanded={defaultExpanded}
        hint={hint}
        onClickConfigure={onClickConfigure}
      />
      {config && (
        <InspectorConfigModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          config={config}
          onUpdate={(updatedConfig) => {
            updateInspectorConfig((configs) =>
              configs.map((c) =>
                c.id === updatedConfig.id ? updatedConfig : c,
              ),
            );
          }}
        />
      )}
    </>
  );
}
