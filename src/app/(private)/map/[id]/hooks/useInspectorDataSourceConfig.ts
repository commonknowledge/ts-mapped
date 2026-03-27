"use client";

import { useMemo } from "react";
import { useDataSources } from "./useDataSources";
import { useMapViews } from "./useMapViews";
import type { DefaultInspectorConfig } from "@/models/DataSource";

export function useInspectorDataSourceConfig(
  dataSourceId: string | null | undefined,
): DefaultInspectorConfig | null | undefined {
  const { view } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  return useMemo(() => {
    if (!dataSourceId) return undefined;

    const viewDataSourceConfig = view?.inspectorConfig?.dataSources?.find(
      (ds) => ds.dataSourceId === dataSourceId,
    );

    if (!viewDataSourceConfig) {
      return dataSource?.defaultInspectorConfig;
    }

    return {
      ...dataSource?.defaultInspectorConfig,
      ...viewDataSourceConfig,
    };
  }, [dataSource, dataSourceId, view?.inspectorConfig?.dataSources]);
}
