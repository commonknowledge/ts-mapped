"use client";

import type {
  InspectorBoundaryConfig,
  InspectorColumnItem,
} from "@/server/models/MapView";

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
export function normalizeInspectorBoundaryConfig(
  config: InspectorBoundaryConfig | null,
  allColumnNames: string[],
): InspectorBoundaryConfig | null {
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
    columnOrder: (config.columnOrder?.length ?? 0) > 0 ? columnOrderUnique : undefined,
    columnItems: columnItems ?? config.columnItems,
  };
}

/**
 * Single source of truth for inspector column order.
 * - allColumnsInOrder: full list in display order (columnOrder when valid, else selected first then alphabetical)
 * - selectedColumnsInOrder: columns that are in config.columns, in the same order as allColumnsInOrder
 * - selectedItemsInOrder: columns + label dividers in display order (from columnItems or derived from columns)
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
  selectedItemsInOrder: InspectorColumnItem[];
  /** Full list for Available column: visible (columns + dividers) then non-visible, with border between */
  allItemsInOrder: InspectorColumnItem[];
  availableColumns: string[];
  availableIds: string[];
  columnIds: string[];
} {
  const normalized = config
    ? normalizeInspectorBoundaryConfig(config, allColumnNames)
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

  const availableColumns = allColumnsInOrder.filter((c) => !columns.includes(c));

  const allItemsInOrder: InspectorColumnItem[] =
    columnItems?.length && columnItems.some((i) => isDivider(i))
      ? [
          ...columnItems.filter((i) =>
            typeof i === "string"
              ? allColumnNames.includes(i)
              : true,
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

/**
 * Returns selected columns in their canonical display order.
 * Uses columnItems only when it contains a divider (explicit order); else columnOrder; else config.columns.
 * This keeps inspector order in sync with "Columns to show" whether or not dividers are used.
 */
export function getSelectedColumnsOrdered(
  config: Pick<
    InspectorBoundaryConfig,
    "columns" | "columnOrder" | "columnItems"
  >,
): string[] {
  const { columns, columnOrder, columnItems } = config;
  const columnsSet = new Set(columns ?? []);

  if (columnItems?.length && columnItems.some((i) => isDivider(i))) {
    const fromItems = columnItems.filter(
      (i): i is string =>
        typeof i === "string" && columnsSet.has(i),
    );
    if (fromItems.length > 0) return fromItems;
  }

  if (!columnOrder?.length) return columns ?? [];
  const ordered = columnOrder.filter((c) => columnsSet.has(c));
  const orderedSet = new Set(ordered);
  for (const c of columns ?? []) {
    if (!orderedSet.has(c)) ordered.push(c);
  }
  return ordered;
}

/**
 * Returns selected items (columns + dividers) in display order.
 * Uses columnItems when set; otherwise returns columns only.
 * Normalizes config first so duplicates never appear.
 */
export function getSelectedItemsOrdered(
  config: Pick<
    InspectorBoundaryConfig,
    "columns" | "columnOrder" | "columnItems"
  >,
  allColumnNames: string[],
): InspectorColumnItem[] {
  const normalized = config
    ? normalizeInspectorBoundaryConfig(
        config as InspectorBoundaryConfig,
        allColumnNames,
      )
    : null;
  const c = normalized ?? config;
  const { columns, columnItems } = c;
  const columnsSet = new Set(columns ?? []);

  if (columnItems?.length && columnItems.some((i) => isDivider(i))) {
    return columnItems.filter((i) =>
      typeof i === "string"
        ? columnsSet.has(i) && allColumnNames.includes(i)
        : true,
    );
  }
  const ordered = getSelectedColumnsOrdered(c);
  return ordered.filter((c) => allColumnNames.includes(c));
}

