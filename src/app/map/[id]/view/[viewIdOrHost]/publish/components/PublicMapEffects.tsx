"use client";

import { useEffect } from "react";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { usePublicDataRecordsQueries } from "../hooks/usePublicDataRecordsQueries";
import { usePublicMapStore } from "../stores/usePublicMapStore";

export function PublicMapEffects() {
  const publicMap = usePublicMapStore((s) => s.publicMap);
  const activeTabId = usePublicMapStore((s) => s.activeTabId);
  const filtersDialogOpen = usePublicMapStore((s) => s.filtersDialogOpen);
  const setFilterFields = usePublicMapStore((s) => s.setFilterFields);
  const dataRecordsQueries = usePublicDataRecordsQueries();

  useEffect(() => {
    // don't run it until user opens the filters
    if (!publicMap || !filtersDialogOpen) {
      return;
    }

    const dataSourceConfig = activeTabId
      ? publicMap.dataSourceConfigs.find((c) => c.dataSourceId === activeTabId)
      : publicMap.dataSourceConfigs[0];

    if (dataSourceConfig) {
      const columns = dataSourceConfig.nameColumns.concat([
        dataSourceConfig.descriptionColumn,
      ]);

      const typedColumns = columns.filter(Boolean).map((name) => ({
        name,
        type: PublicMapColumnType.String,
      }));

      for (const additionalColumn of dataSourceConfig.additionalColumns) {
        for (const sourceColumn of additionalColumn.sourceColumns) {
          typedColumns.push({
            name: sourceColumn,
            type: additionalColumn.type,
          });
        }
      }

      const fields = typedColumns.map((col) => {
        if (col.type === PublicMapColumnType.CommaSeparatedList) {
          const records =
            dataRecordsQueries?.[dataSourceConfig?.dataSourceId]?.data?.records;

          if (!records?.length) {
            return col;
          }

          const allValues = records
            .map((record) => record.json[col.name] as string | undefined)
            .filter(Boolean) // remove null
            .flatMap((item) => item.split(",").map((s) => s.trim())); // split and trim;

          const uniqueValues = [...new Set(allValues)].sort((a, b) =>
            a.localeCompare(b),
          );

          return {
            ...col,
            options: uniqueValues,
          };
        }

        return col;
      });

      setFilterFields(fields);
    }
  }, [
    publicMap,
    activeTabId,
    dataRecordsQueries,
    filtersDialogOpen,
    setFilterFields,
  ]);

  return null;
}
