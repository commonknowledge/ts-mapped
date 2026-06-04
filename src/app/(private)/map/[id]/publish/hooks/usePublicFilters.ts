import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { PublicMapColumnType } from "@/models/PublicMap";
import { getListingSort, parseDate } from "@/utils/dataRecord";
import {
  publicDateFilterAtom,
  publicFiltersAtom,
} from "../atoms/publicFiltersAtoms";
import { ALLOWED_FILTERS, TRANS_FRIENDLY_HOST } from "../const";
import { getDateFilterRange } from "../dateFilters";
import { filterRecords, getActiveFilters } from "../filtersHelpers";
import { usePublicDataRecordsQueries } from "./usePublicDataRecordsQueries";
import {
  useActiveDataSourceId,
  usePublicDataSourceIds,
  usePublicMapValue,
} from "./usePublicMap";
import type { FilterField } from "@/types";

export function usePublicFilters() {
  return useAtomValue(publicFiltersAtom);
}

export function useSetPublicFilters() {
  return useSetAtom(publicFiltersAtom);
}

export function usePublicDateFilter() {
  return useAtomValue(publicDateFilterAtom);
}

export function useSetPublicDateFilter() {
  return useSetAtom(publicDateFilterAtom);
}

export function useFilterFields() {
  const publicMap = usePublicMapValue();
  const activeDataSourceId = useActiveDataSourceId();
  const publicDataSourceIds = usePublicDataSourceIds();
  const dataRecordsQueries = usePublicDataRecordsQueries();

  return useMemo(() => {
    if (!publicMap) {
      return [];
    }

    const dataSourceConfig = activeDataSourceId
      ? publicMap.dataSourceConfigs.find(
          (c) => c.dataSourceId === activeDataSourceId,
        )
      : publicMap.dataSourceConfigs.find(
          (c) => c.dataSourceId === publicDataSourceIds[0],
        );

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
      // Link columns are display-only (rendered as a button), not filterable.
      if (additionalColumn.type === PublicMapColumnType.Link) {
        continue;
      }
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
  }, [publicMap, activeDataSourceId, publicDataSourceIds, dataRecordsQueries]);
}

export function useFilteredRecords() {
  const publicMap = usePublicMapValue();
  const activeDataSourceId = useActiveDataSourceId();
  const publicDataSourceIds = usePublicDataSourceIds();
  const dataRecordsQueries = usePublicDataRecordsQueries();
  const publicFilters = usePublicFilters();
  const publicDateFilter = usePublicDateFilter();

  return useMemo(() => {
    if (!publicMap) {
      return [];
    }

    const dataRecordsQuery = activeDataSourceId
      ? dataRecordsQueries?.[activeDataSourceId]
      : dataRecordsQueries?.[publicDataSourceIds[0]];

    if (!dataRecordsQuery) {
      return [];
    }

    const dataSource = dataRecordsQuery.data;
    const allRecords = dataSource?.records || [];
    const dataSourceId = dataSource?.id;
    const dataSourceConfig = dataSourceId
      ? publicMap.dataSourceConfigs.find((c) => c.dataSourceId === dataSourceId)
      : undefined;
    const activeFilters = getActiveFilters(
      dataSourceId ? publicFilters[dataSourceId] : undefined,
    );

    const useUnknownValues = publicMap.host === TRANS_FRIENDLY_HOST;
    let records = activeFilters?.length
      ? filterRecords(activeFilters, allRecords, useUnknownValues)
      : allRecords;

    // Apply the date quick-filter, but only when the listing is sorted by date
    // (the buttons are only shown then).
    const dateFilterKey = dataSourceId
      ? publicDateFilter[dataSourceId]
      : undefined;
    const sortedByDate =
      getListingSort({ dataSource, dataSourceConfig }).sortBy === "date";
    if (dateFilterKey && sortedByDate) {
      const { start, end } = getDateFilterRange(dateFilterKey);
      records = records.filter((record) => {
        const date = parseDate({
          dataSource,
          dataRecord: record,
          dataSourceConfig,
        });
        return date >= start && date <= end;
      });
    }

    return records;
  }, [
    activeDataSourceId,
    publicDataSourceIds,
    dataRecordsQueries,
    publicFilters,
    publicDateFilter,
    publicMap,
  ]);
}
