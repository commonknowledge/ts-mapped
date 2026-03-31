"use client";

import { Settings } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { useDataSources } from "@/hooks/useDataSources";
import { buildName } from "@/utils/dataRecord";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { useViewId } from "../../hooks/useMapViews";
import { useUpdateInspectorConfig } from "../../hooks/useUpdateInspectorConfig";
import { useViewInspectorConfig } from "../../hooks/useViewInspectorConfig";
import ConfiguredDataRecordDisplay from "./ConfiguredDataRecordDisplay";
import { InspectorConfigModal } from "./InspectorConfigModal";
import {
  InspectorPanelIcon,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import { deriveInspectorItems } from "./utils";
import type { InspectorConfig } from "../../hooks/useUpdateInspectorConfig";
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
  const viewId = useViewId();
  const inspectorConfigs = useViewInspectorConfig();
  const updateInspectorConfig = useUpdateInspectorConfig();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<InspectorConfig | null>(null);

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

  const currentConfig = useMemo(() => {
    if (configDraft) return configDraft;
    const existing = inspectorConfigs.find(
      (c) => c.dataSourceId === dataSourceId,
    );
    return existing ?? null;
  }, [configDraft, dataSourceId, inspectorConfigs]);

  const ensureInspectorConfig = useCallback((): InspectorConfig | null => {
    if (!dataSource || !viewId) return null;

    const existing = inspectorConfigs.find(
      (c) => c.dataSourceId === dataSourceId,
    );
    if (existing) {
      setConfigDraft(null);
      return existing;
    }

    const derivedItems = deriveInspectorItems(
      dataSource.columnDefs ?? [],
      dataSource.columnMetadata ?? [],
    );
    const derivedLayout = derivedItems.length > 4 ? "twoColumn" : null;

    const next: InspectorConfig = {
      id: uuidv4(),
      dataSourceId,
      mapViewId: viewId,
      position: inspectorConfigs.length,
      name: dataSource.name || "Data Source",
      description: null,
      icon: null,
      screenshotUrl: null,
      color: null,
      items: derivedItems,
      layout: derivedLayout,
      ...dataSource.defaultInspectorConfig,
    };

    setConfigDraft(next);
    updateInspectorConfig((configs) => [...configs, next]);
    return next;
  }, [
    dataSource,
    viewId,
    inspectorConfigs,
    dataSourceId,
    updateInspectorConfig,
  ]);

  return (
    <TogglePanel
      label={inspectorConfig?.name || dataSource?.name || "Data"}
      icon={panelIcon}
      defaultExpanded={defaultExpanded}
      wrapperClassName={colorClass}
      headerRight={
        <IconButtonWithTooltip
          tooltip="Inspector settings"
          onClick={() => {
            const config = ensureInspectorConfig();
            if (!config) return;
            setIsConfigModalOpen(true);
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
        </IconButtonWithTooltip>
      }
    >
      {currentConfig && (
        <InspectorConfigModal
          open={isConfigModalOpen}
          onOpenChange={setIsConfigModalOpen}
          config={currentConfig}
          onUpdate={(updatedConfig) => {
            setConfigDraft(updatedConfig);
            updateInspectorConfig((configs) =>
              configs.map((c) =>
                c.id === updatedConfig.id ? updatedConfig : c,
              ),
            );
          }}
        />
      )}
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
