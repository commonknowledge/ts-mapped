"use client";

import type { InspectorItem } from "@/models/MapView";
import type { InspectorDataSourceConfig } from "@/models/MapView";

function isColumn(
  item: InspectorItem,
): item is Extract<InspectorItem, { type: "column" }> {
  return item.type === "column";
}

/**
 * Returns the ordered list of inspector items (columns + dividers) for a given
 * data source config, filtered to only include columns that exist in the data source.
 */
export function getSelectedItemsOrdered(
  config: InspectorDataSourceConfig | null,
  allColumnNames: string[],
): InspectorItem[] {
  if (!config) return [];
  const items = config.inspectorItems ?? [];
  const validSet = new Set(allColumnNames);
  return items.filter((i) => i.type === "divider" || validSet.has(i.name));
}

/**
 * Returns state for the column order UI in the inspector settings modal.
 */
export function getColumnOrderState(
  config: InspectorDataSourceConfig | null,
  allColumnNames: string[],
): {
  selectedColumnsInOrder: string[];
  selectedItemsInOrder: InspectorItem[];
  availableColumns: string[];
  columnIds: string[];
} {
  const items = getSelectedItemsOrdered(config, allColumnNames);
  const selectedColumnsInOrder = items.filter(isColumn).map((i) => i.name);
  const availableColumns = allColumnNames
    .filter((n) => !selectedColumnsInOrder.includes(n))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const columnIds = selectedColumnsInOrder.map((c, i) => `col-${i}-${c}`);
  return {
    selectedColumnsInOrder,
    selectedItemsInOrder: items,
    availableColumns,
    columnIds,
  };
}

export function getSelectedColumnsOrdered(
  config: InspectorDataSourceConfig | null,
  allColumnNames: string[],
): string[] {
  return getColumnOrderState(config, allColumnNames).selectedColumnsInOrder;
}
