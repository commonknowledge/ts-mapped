"use client";

import { useCallback, useState } from "react";
import { buildDefaultInspectorConfig } from "@/app/(private)/map/[id]/components/InspectorPanel/utils";
import { useDataSources } from "@/hooks/useDataSources";
import { useViewId } from "./useMapViews";
import { useUpdateInspectorConfig } from "./useUpdateInspectorConfig";
import { useViewInspectorConfig } from "./useViewInspectorConfig";
import type { InspectorConfig } from "./useUpdateInspectorConfig";

/**
 * Open the inspector configuration modal for a data source, seeding a
 * per-map-view config (from the data source's defaults) when none exists yet,
 * so the modal always has a config to edit. Shared by the inspector panel's
 * header settings button and the per-location-data-source configure button.
 */
export function useOpenInspectorConfig(
  dataSourceId: string | null | undefined,
): {
  config: InspectorConfig | undefined;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  openConfig: () => void;
  onUpdateConfig: (config: InspectorConfig) => void;
} {
  const viewId = useViewId();
  const inspectorConfigs = useViewInspectorConfig();
  const updateInspectorConfig = useUpdateInspectorConfig();
  const { getDataSourceById } = useDataSources();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const config = inspectorConfigs.find((c) => c.dataSourceId === dataSourceId);

  const openConfig = useCallback(() => {
    if (!viewId || !dataSourceId) return;

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

  const onUpdateConfig = useCallback(
    (updatedConfig: InspectorConfig) => {
      updateInspectorConfig((configs) =>
        configs.map((c) => (c.id === updatedConfig.id ? updatedConfig : c)),
      );
    },
    [updateInspectorConfig],
  );

  return { config, isModalOpen, setIsModalOpen, openConfig, onUpdateConfig };
}
