"use client";

import { useContext, useEffect, useState } from "react";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { ALLOWED_FILTERS } from "../const";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import { PublicMapContext } from "../context/PublicMapContext";
import { usePublicDataRecordsQueries } from "../hooks/usePublicDataRecordsQueries";
import type { RouterOutputs } from "@/services/trpc/react";
import type { FilterField, PublicFiltersFormValue } from "@/types";
import type { ReactNode } from "react";

export default function PublicFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { publicMap, activeTabId } = useContext(PublicMapContext);
  const dataRecordsQueries = usePublicDataRecordsQueries();
  const [filterFields, setFilterFields] = useState<FilterField[]>([]);
  const [publicFilters, setPublicFilters] = useState<
    Record<string, PublicFiltersFormValue[]>
  >({});
  const [records, setRecords] = useState<
    NonNullable<RouterOutputs["dataSource"]["byIdWithRecords"]>["records"]
  >([]);

  useEffect(() => {
    // don't run it until user opens the filters
    if (!publicMap) {
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

      const allowedFields = ALLOWED_FILTERS.map((allowed) => {
        const field = fields.find((f) => f.name === allowed.name);

        return {
          ...(field as FilterField),
          label: allowed?.label,
        };
      }).filter((f) => !!f?.name);

      setFilterFields(allowedFields);
    }
  }, [publicMap, activeTabId, dataRecordsQueries]);

  return (
    <PublicFiltersContext
      value={{
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
