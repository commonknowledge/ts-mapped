"use client";

import { useMemo } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { useViewInspectorConfig } from "./useViewInspectorConfig";
import type { DefaultInspectorConfig } from "@/models/DataSource";

export function useInspectorDataSourceConfig(
  dataSourceId: string | null | undefined,
): DefaultInspectorConfig | null | undefined {
  const inspectorConfigs = useViewInspectorConfig();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  return useMemo(() => {
    if (!dataSourceId) return undefined;

    const viewDataSourceConfig = inspectorConfigs.find(
      (ds) => ds.dataSourceId === dataSourceId,
    );

    if (!viewDataSourceConfig) {
      return dataSource?.defaultInspectorConfig;
    }

    return {
      ...dataSource?.defaultInspectorConfig,
      ...viewDataSourceConfig,
    };
  }, [dataSource, dataSourceId, inspectorConfigs]);
}
