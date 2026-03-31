"use client";

import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useDataSources } from "@/hooks/useDataSources";
import { buildName } from "@/utils/dataRecord";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import ConfiguredDataRecordDisplay from "./ConfiguredDataRecordDisplay";
import {
  InspectorPanelIcon,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import type { DataRecord } from "@/models/DataRecord";

export default function DataRecordsPanel({
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
      <div className="space-y-4 px-2">
        {hint && (
          <p className="text-sm text-muted-foreground italic text-center">
            {hint}
          </p>
        )}
        {isLoading ? (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Loading...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No data</p>
          </div>
        ) : records.length === 1 ? (
          <div>
            <ConfiguredDataRecordDisplay
              json={records[0].json}
              dataSourceId={dataSourceId}
            />
          </div>
        ) : (
          <ul>
            {records.map((record, i) => (
              <li key={record.id}>
                <TogglePanel
                  label={buildName(dataSource, record)}
                  defaultExpanded={i === 0}
                >
                  <ConfiguredDataRecordDisplay
                    json={record.json}
                    dataSourceId={dataSourceId}
                  />
                </TogglePanel>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TogglePanel>
  );
}
