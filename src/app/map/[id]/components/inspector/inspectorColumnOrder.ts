"use client";

import type { InspectorBoundaryConfig, InspectorChartDataSource } from "@/server/models/MapView";

/**
 * Single source of truth for inspector column order.
 * - allColumnsInOrder: full list in display order (columnOrder when valid, else selected first then alphabetical)
 * - selectedColumnsInOrder: columns that are in config.columns, in the same order as allColumnsInOrder
 */

export function getAllColumnsSorted(allColumnNames: string[]): string[] {
  return [...allColumnNames].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function getColumnOrderState(
  config: InspectorBoundaryConfig | null,
  allColumnNames: string[],
): {
  allColumnsInOrder: string[];
  selectedColumnsInOrder: string[];
  availableColumns: string[];
  availableIds: string[];
  columnIds: string[];
} {
  const columns = config?.columns ?? [];
  const allColumnsSorted = getAllColumnsSorted(allColumnNames);

  const allColumnsInOrder =
    config?.columnOrder?.filter((c) => allColumnNames.includes(c))?.length ===
    allColumnNames.length
      ? config.columnOrder!.filter((c) => allColumnNames.includes(c))
      : (() => {
          const selected = columns.filter((c) => allColumnNames.includes(c));
          const rest = allColumnsSorted.filter((c) => !selected.includes(c));
          return [...selected, ...rest];
        })();

  const selectedColumnsInOrder = allColumnsInOrder.filter((c) =>
    columns.includes(c),
  );
  const availableColumns = allColumnsInOrder.filter((c) => !columns.includes(c));
  const availableIds = allColumnsInOrder.map((c) => `available-${c}`);
  const columnIds = selectedColumnsInOrder.map((c) => `col-${c}`);

  return {
    allColumnsInOrder,
    selectedColumnsInOrder,
    availableColumns,
    availableIds,
    columnIds,
  };
}

/**
 * Chart columns in the same order as config.columns (so chart order matches column list).
 */
export function getChartColumnNames(
  columns: string[],
  columnMetadata: InspectorBoundaryConfig["columnMetadata"],
  chartDataSource: InspectorChartDataSource,
  chartColumnNames: string[] | undefined,
): string[] {
  const meta = columnMetadata ?? {};
  if (chartDataSource === "custom" && chartColumnNames?.length) {
    return columns.filter((c) => chartColumnNames.includes(c));
  }
  const formatMatch = chartDataSource as "number" | "percentage" | "scale";
  return columns.filter((col) => meta[col]?.format === formatMatch);
}
