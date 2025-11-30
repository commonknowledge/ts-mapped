"use client";

import { useContext, useMemo, useState } from "react";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { ALLOWED_FILTERS } from "../const";
import { PublicFiltersContext } from "../context/PublicFiltersContext";
import { PublicMapContext } from "../context/PublicMapContext";
import { filterRecords, getActiveFilters } from "../filtersHelpers";
import { usePublicDataRecordsQueries } from "../hooks/usePublicDataRecordsQueries";
import { groupRecords } from "../utils";
import type { FilterField, PublicFiltersFormValue } from "@/types";
import type { ReactNode } from "react";

export default function PublicFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { publicMap, activeTabId } = useContext(PublicMapContext);
  const dataRecordsQueries = usePublicDataRecordsQueries();
  const [publicFilters, setPublicFilters] = useState<
    Record<string, PublicFiltersFormValue[]>
  >({});

  const filterFields = useMemo(() => {
    if (!publicMap) {
      return [];
    }

    const dataSourceConfig = activeTabId
      ? publicMap.dataSourceConfigs.find((c) => c.dataSourceId === activeTabId)
      : publicMap.dataSourceConfigs[0];

    if (!dataSourceConfig) {
      return [];
    }

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
        label: allowed.label,
      };
    }).filter((f) => Boolean(f?.name));

    return allowedFields;
  }, [publicMap, activeTabId, dataRecordsQueries]);

  const recordGroups = useMemo(() => {
    if (!publicMap) {
      return [];
    }

    const dataSourceConfig = activeTabId
      ? publicMap.dataSourceConfigs.find((c) => c.dataSourceId === activeTabId)
      : publicMap.dataSourceConfigs[0];

    const dataRecordsQuery = activeTabId
      ? dataRecordsQueries?.[activeTabId]
      : dataRecordsQueries?.[0];
    const allRecords = dataRecordsQuery?.data?.records || [];
    const dataSourceId = dataRecordsQuery.data?.id;
    const activeFilters = getActiveFilters(
      dataSourceId ? publicFilters[dataSourceId] : undefined,
    );

    const filteredRecords = activeFilters?.length
      ? filterRecords(activeFilters, allRecords)
      : allRecords;

    return groupRecords(dataSourceConfig, filteredRecords);
  }, [activeTabId, dataRecordsQueries, publicFilters, publicMap]);

  return (
    <PublicFiltersContext
      value={{
        filterFields,
        publicFilters,
        setPublicFilters,
        recordGroups,
      }}
    >
      {children}
    </PublicFiltersContext>
  );
}
