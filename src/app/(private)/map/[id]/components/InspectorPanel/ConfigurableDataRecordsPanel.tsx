"use client";

import { useMapEditable } from "../../hooks/useMapEditable";
import { useOpenInspectorConfig } from "../../hooks/useOpenInspectorConfig";
import DataRecordsPanel from "./DataRecordsPanel";
import { InspectorConfigModal } from "./InspectorConfigModal";
import type { DataRecord } from "@/models/DataRecord";

export default function ConfigurableDataRecordsPanel({
  dataSourceId,
  records,
  isLoading,
  isRefreshing = false,
  defaultExpanded,
  hint,
}: {
  dataSourceId: string;
  records: DataRecord[];
  isLoading: boolean;
  isRefreshing?: boolean;
  defaultExpanded: boolean;
  hint?: string;
}) {
  const { config, isModalOpen, setIsModalOpen, openConfig, onUpdateConfig } =
    useOpenInspectorConfig(dataSourceId);
  const editable = useMapEditable();

  return (
    <>
      <DataRecordsPanel
        dataSourceId={dataSourceId}
        records={records}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        defaultExpanded={defaultExpanded}
        hint={hint}
        onClickConfigure={editable ? openConfig : undefined}
      />
      {config && (
        <InspectorConfigModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          config={config}
          onUpdate={onUpdateConfig}
        />
      )}
    </>
  );
}
