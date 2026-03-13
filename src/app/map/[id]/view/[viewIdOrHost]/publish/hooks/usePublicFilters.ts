import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { publicFiltersAtom } from "../atoms/publicFiltersAtoms";
import { ALLOWED_FILTERS, TRANS_FRIENDLY_HOST } from "../const";
import { filterRecords, getActiveFilters } from "../filtersHelpers";
import { usePublicDataRecordsQueries } from "./usePublicDataRecordsQueries";
import { useActiveTabId, usePublicMapValue } from "./usePublicMap";
import type { FilterField } from "@/types";

export function usePublicFilters() {
  return useAtomValue(publicFiltersAtom);
}

export function useSetPublicFilters() {
  return useSetAtom(publicFiltersAtom);
}

export function useFilterFields() {
  const publicMap = usePublicMapValue();
  const activeTabId = useActiveTabId();
  const dataRecordsQueries = usePublicDataRecordsQueries();

  return useMemo(() => {
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

    if (publicMap.host === TRANS_FRIENDLY_HOST) {
      return ALLOWED_FILTERS.map((allowed) => {
        const field = fields.find((f) => f.name === allowed.name);

        return {
          ...(field as FilterField),
          label: allowed.label,
        };
      }).filter((f) => Boolean(f?.name));
    }

    return fields;
  }, [publicMap, activeTabId, dataRecordsQueries]);
}

export function useFilteredRecords() {
  const publicMap = usePublicMapValue();
  const activeTabId = useActiveTabId();
  const dataRecordsQueries = usePublicDataRecordsQueries();
  const publicFilters = usePublicFilters();

  return useMemo(() => {
    if (!publicMap) {
      return [];
    }

    const dataRecordsQuery = activeTabId
      ? dataRecordsQueries?.[activeTabId]
      : dataRecordsQueries?.[publicMap.dataSourceConfigs[0]?.dataSourceId];

    if (!dataRecordsQuery) {
      return [];
    }

    const allRecords = dataRecordsQuery.data?.records || [];
    const dataSourceId = dataRecordsQuery.data?.id;
    const activeFilters = getActiveFilters(
      dataSourceId ? publicFilters[dataSourceId] : undefined,
    );

    const useUnknownValues = publicMap.host === TRANS_FRIENDLY_HOST;
    return activeFilters?.length
      ? filterRecords(activeFilters, allRecords, useUnknownValues)
      : allRecords;
  }, [activeTabId, dataRecordsQueries, publicFilters, publicMap]);
}
