"use client";

import { useCallback } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { buildName } from "@/utils/dataRecord";
import { useAreaSettings } from "./useAreaSettings";

/**
 * How the inspector names a data source's records: by the column chosen for
 * this view, falling back to the source's own name columns
 */
export function useRecordName(dataSourceId: string) {
  const { areaSettings: viewConfig, updateConfig: updateViewConfig } =
    useAreaSettings();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);
  const nameColumns = viewConfig.inspectorRecordNameColumns;
  const nameColumn = nameColumns?.[dataSourceId];

  const getName = useCallback(
    (record: { externalId: string; json: Record<string, unknown> }) => {
      const value = nameColumn ? record.json[nameColumn] : undefined;
      const name =
        value === undefined || value === null ? "" : String(value).trim();
      return name || buildName(dataSource, record);
    },
    [dataSource, nameColumn],
  );

  const setNameColumn = useCallback(
    (column: string | null) => {
      const next = Object.fromEntries(
        Object.entries(nameColumns ?? {}).filter(([id]) => id !== dataSourceId),
      );
      if (column) next[dataSourceId] = column;
      updateViewConfig({ inspectorRecordNameColumns: next });
    },
    [dataSourceId, nameColumns, updateViewConfig],
  );

  return { nameColumn, getName, setNameColumn };
}
