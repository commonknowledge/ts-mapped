"use client";

import { ReactNode, useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import type { PublicMapDataRecordsQuery } from "@/__generated__/types";
import type { FilterField, PublicFiltersFormValue } from "@/types";

export default function PublicFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
    const { publicMap, activeTabId, dataRecordsQueries } =
      useContext(PublicMapContext);
  const [filtersDialogOpen, setFiltersDialogOpen] = useState<boolean>(false);
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [publicFilters, setPublicFilters] = useState<PublicFiltersFormValue[]>(
    []
  );
  const [records, setRecords] = useState<
    NonNullable<PublicMapDataRecordsQuery["dataSource"]>["records"]
  >([]);

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

      const typedColumns = columns
        .filter(Boolean)
        .map((name) => ({
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
            dataRecordsQueries?.[dataSourceConfig?.dataSourceId]?.data
              ?.dataSource?.records;

          if (!records?.length) {
            return col;
          }

          const allValues = records
            .map((record) => record.json[col.name])
            .filter(Boolean) // remove null
            .flatMap((item: string) =>
              item.split(",").map((s: string) => s.trim())
            ); // split and trim;

          const uniqueValues = [...new Set(allValues)].sort((a, b) =>
            a.localeCompare(b)
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
  }, [publicMap, activeTabId, dataRecordsQueries, filtersDialogOpen]);


  return (
    <PublicFiltersContext
      value={{
        filtersDialogOpen,
        setFiltersDialogOpen,
        filterFields,
        setFilterFields,
        publicFilters,
        setPublicFilters,
        records,
        setRecords,
      }}
    >
      {children}
    </PublicFiltersContext>
  );
}
