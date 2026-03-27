"use client";

import { useMemo } from "react";
import { useDataSources } from "./useDataSources";
import { useMapViews } from "./useMapViews";
import type { InspectorColumn } from "@/models/shared";

export function useInspectorColumn(
  dataSourceId: string | null | undefined,
  columnName: string,
): InspectorColumn | undefined {
  const { view } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  return useMemo(() => {
    if (!dataSourceId) return undefined;

    const viewDataSourceConfig = view?.inspectorConfig?.dataSources?.find(
      (ds) => ds.dataSourceId === dataSourceId,
    );

    const resolvedConfig = {
      ...dataSource?.defaultInspectorConfig,
      ...viewDataSourceConfig,
    };

    return (
      resolvedConfig.items
        ?.filter(
          (item): item is Extract<typeof item, { type: "column" }> =>
            item.type === "column",
        )
        .find((item) => item.name === columnName) ?? undefined
    );
  }, [view, dataSourceId, dataSource?.defaultInspectorConfig, columnName]);
}
