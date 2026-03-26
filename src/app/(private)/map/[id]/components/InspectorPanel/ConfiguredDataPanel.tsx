"use client";

import { useMemo } from "react";
import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import { resolveInspectorConfig } from "@/utils/resolveInspectorConfig";
import { useDataSources } from "../../hooks/useDataSources";
import ConfiguredRecordsList from "./ConfiguredRecordsList";
import {
  InspectorPanelIcon,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import type { InspectorDataSourceConfig } from "@/models/MapView";

interface DataRecord {
  id: string;
  externalId: string;
  json: Record<string, unknown>;
}

export default function ConfiguredDataPanel({
  config,
  records,
  isLoading,
  defaultExpanded,
}: {
  config: InspectorDataSourceConfig;
  records: DataRecord[];
  isLoading: boolean;
  defaultExpanded: boolean;
}) {
  const { getDataSourceById } = useDataSources();

  const dataSource = getDataSourceById(config.dataSourceId);

  const inspectorConfig = useMemo(
    () => resolveInspectorConfig(config, dataSource?.defaultInspectorConfig),
    [config, dataSource],
  );

  const dataSourceType = dataSource?.config?.type ?? null;
  const panelIcon = inspectorConfig.icon ? (
    <InspectorPanelIcon
      iconName={inspectorConfig.icon}
      className="h-4 w-4 shrink-0"
    />
  ) : dataSourceType ? (
    <span className="shrink-0">
      <DataSourceIcon type={dataSourceType} />
    </span>
  ) : undefined;

  const colorClass = getInspectorColorClass(inspectorConfig.color);

  return (
    <TogglePanel
      label={config.name}
      icon={panelIcon}
      defaultExpanded={defaultExpanded}
      wrapperClassName={colorClass}
    >
      {isLoading ? (
        <div className="py-4 text-center text-muted-foreground">
          <p className="text-sm">Loading...</p>
        </div>
      ) : (
        <ConfiguredRecordsList
          records={records}
          dataSource={dataSource}
          inspectorConfig={inspectorConfig}
        />
      )}
    </TogglePanel>
  );
}
