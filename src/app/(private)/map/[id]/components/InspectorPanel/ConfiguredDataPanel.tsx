"use client";

import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useDataSources } from "@/hooks/useDataSources";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import ConfiguredRecordsList from "./ConfiguredRecordsList";
import {
  InspectorPanelIcon,
  getInspectorColorClass,
} from "./inspectorPanelOptions";

interface DataRecord {
  id: string;
  externalId: string;
  json: Record<string, unknown>;
}

export default function ConfiguredDataPanel({
  dataSourceId,
  records,
  isLoading,
  defaultExpanded,
}: {
  dataSourceId: string;
  records: DataRecord[];
  isLoading: boolean;
  defaultExpanded: boolean;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);

  const dataSourceType = dataSource?.config?.type ?? null;
  const panelIcon = inspectorConfig?.icon ? (
    <InspectorPanelIcon
      iconName={inspectorConfig.icon}
      className="h-4 w-4 shrink-0"
    />
  ) : dataSourceType ? (
    <span className="shrink-0">
      <DataSourceIcon type={dataSourceType} />
    </span>
  ) : undefined;

  const colorClass = getInspectorColorClass(inspectorConfig?.color);

  return (
    <TogglePanel
      label={inspectorConfig?.name || dataSource?.name || "Data"}
      icon={panelIcon}
      defaultExpanded={defaultExpanded}
      wrapperClassName={colorClass}
    >
      {isLoading ? (
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm">Loading...</p>
        </div>
      ) : (
        <ConfiguredRecordsList dataSourceId={dataSourceId} records={records} />
      )}
    </TogglePanel>
  );
}
