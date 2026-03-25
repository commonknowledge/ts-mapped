"use client";

import type {
  InspectorColumnItem,
  InspectorDataSourceConfig,
} from "@/models/MapView";

function isDivider(
  item: InspectorColumnItem,
): item is { type: "divider"; id: string; label: string } {
  return typeof item === "object" && item !== null && item.type === "divider";
}

/**
 * Normalize inspector config so columns, columnOrder, and columnItems
 * never contain duplicate column names. Call after load and after every update
 * so the rest of the code can assume unique columns.
 */
export function normalizeInspectorDataSourceConfig(
  config: InspectorDataSourceConfig | null,
  allColumnNames: string[],
): InspectorDataSourceConfig | null {
  if (!config) return null;
  const validSet = new Set(allColumnNames);

  const columns = (config.columns ?? []).filter((c) => validSet.has(c));
  const seenColumns = new Set<string>();
  const columnsUnique: string[] = [];
  for (const c of columns) {
    if (seenColumns.has(c)) continue;
    seenColumns.add(c);
    columnsUnique.push(c);
  }

  const columnOrder = (config.columnOrder ?? []).filter((c) => validSet.has(c));
  const seenOrder = new Set<string>();
  const columnOrderUnique: string[] = [];
  for (const c of columnOrder) {
    if (seenOrder.has(c)) continue;
    seenOrder.add(c);
    columnOrderUnique.push(c);
  }

  let columnItems = config.columnItems;
  if (columnItems?.length) {
    const seenItems = new Set<string>();
    columnItems = columnItems.filter((i) => {
      if (typeof i === "string") {
        if (!validSet.has(i) || !columnsUnique.includes(i)) return false;
        if (seenItems.has(i)) return false;
        seenItems.add(i);
        return true;
      }
      return true;
    });
  }

  return {
    ...config,
    columns: columnsUnique,
    columnOrder:
      (config.columnOrder?.length ?? 0) > 0 ? columnOrderUnique : undefined,
    columnItems: columnItems ?? config.columnItems,
  };
}

export function getAllColumnsSorted(allColumnNames: string[]): string[] {
  return [...allColumnNames].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function getColumnOrderState(
  config: InspectorDataSourceConfig | null,
  allColumnNames: string[],
): {
  allColumnsInOrder: string[];
  selectedColumnsInOrder: string[];
  selectedItemsInOrder: InspectorColumnItem[];
  allItemsInOrder: InspectorColumnItem[];
  availableColumns: string[];
  availableIds: string[];
  columnIds: string[];
} {
  const normalized = config
    ? normalizeInspectorDataSourceConfig(config, allColumnNames)
    : null;
  const columns = normalized?.columns ?? [];
  const columnOrder = normalized?.columnOrder;
  const columnItems = normalized?.columnItems;
  const allColumnsSorted = getAllColumnsSorted(allColumnNames);

  const allColumnsInOrder =
    columnOrder?.length === allColumnNames.length
      ? columnOrder
      : (() => {
          const selected = columns.filter((c) => allColumnNames.includes(c));
          const rest = allColumnsSorted.filter((c) => !selected.includes(c));
          return [...selected, ...rest];
        })();

  const selectedColumnsInOrder = allColumnsInOrder.filter((c) =>
    columns.includes(c),
  );

  const selectedItemsInOrder: InspectorColumnItem[] =
    columnItems?.length && columnItems.some((i) => isDivider(i))
      ? columnItems.filter((i) =>
          typeof i === "string"
            ? allColumnNames.includes(i) && columns.includes(i)
            : true,
        )
      : selectedColumnsInOrder;

  const availableColumns = allColumnsInOrder.filter(
    (c) => !columns.includes(c),
  );

  const allItemsInOrder: InspectorColumnItem[] =
    columnItems?.length && columnItems.some((i) => isDivider(i))
      ? [
          ...columnItems.filter((i) =>
            typeof i === "string" ? allColumnNames.includes(i) : true,
          ),
          ...availableColumns,
        ]
      : [...selectedColumnsInOrder, ...availableColumns];

  const availableIds = allItemsInOrder.map((i, idx) =>
    typeof i === "string" ? `available-${idx}::${i}` : `divider-${i.id}`,
  );
  const columnIds = selectedColumnsInOrder.map(
    (colName, index) => `col-${index}-${colName}`,
  );

  return {
    allColumnsInOrder,
    selectedColumnsInOrder,
    selectedItemsInOrder,
    allItemsInOrder,
    availableColumns,
    availableIds,
    columnIds,
  };
}

export function getSelectedColumnsOrdered(
  config: InspectorDataSourceConfig | null,
  allColumnNames: string[],
): string[] {
  return getColumnOrderState(config, allColumnNames).selectedColumnsInOrder;
}

export function getSelectedItemsOrdered(
  config: InspectorDataSourceConfig | null,
  allColumnNames: string[],
): InspectorColumnItem[] {
  return getColumnOrderState(config, allColumnNames).selectedItemsInOrder;
}
