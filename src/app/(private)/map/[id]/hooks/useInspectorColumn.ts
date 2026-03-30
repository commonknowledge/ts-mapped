"use client";

import { useMemo } from "react";
import { useInspectorDataSourceConfig } from "./useInspectorDataSourceConfig";
import type { InspectorColumn } from "@/models/shared";

export function useInspectorColumn(
  dataSourceId: string | null | undefined,
  columnName: string,
): InspectorColumn | undefined {
  const resolvedConfig = useInspectorDataSourceConfig(dataSourceId);

  return useMemo(() => {
    if (!dataSourceId) return undefined;

    return (
      resolvedConfig?.items
        ?.filter(
          (item): item is Extract<typeof item, { type: "column" }> =>
            item.type === "column",
        )
        .find((item) => item.name === columnName) ?? undefined
    );
  }, [resolvedConfig, dataSourceId, columnName]);
}
