"use client";

import type {
  InspectorBoundaryConfig,
  InspectorColumnItem,
} from "@/server/models/MapView";

/**
 * Dedupe columns preserving order (first occurrence wins).
 * Use when loading or applying config to avoid duplicate column entries.
 */
export function dedupeColumns(cols: string[]): string[] {
  const seen = new Set<string>();
  return cols.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

/**
 * Dedupe columnItems: keep dividers, dedupe column names (first occurrence wins).
 */
export function dedupeColumnItems(
  items: InspectorBoundaryConfig["columnItems"],
): InspectorBoundaryConfig["columnItems"] {
  if (!items?.length) return items;
  const seen = new Set<string>();
  return items.filter((i) => {
    if (typeof i === "string") {
      if (seen.has(i)) return false;
      seen.add(i);
      return true;
    }
    return true;
  });
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

function isDivider(
  item: InspectorColumnItem,
): item is { type: "divider"; id: string; label: string } {
  return typeof item === "object" && item !== null && item.type === "divider";
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

  const selectedItemsInOrder: InspectorColumnItem[] =
    config?.columnItems?.length &&
    config.columnItems.some((i) => isDivider(i))
      ? config.columnItems.filter(
          (i) =>
            typeof i === "string"
              ? allColumnNames.includes(i) && columns.includes(i)
              : true,
        )
      : selectedColumnsInOrder;

  const availableColumns = allColumnsInOrder.filter((c) => !columns.includes(c));

  const allItemsInOrder: InspectorColumnItem[] =
    config?.columnItems?.length &&
    config.columnItems.some((i) => isDivider(i))
      ? [
          ...config.columnItems.filter((i) =>
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
  const columnIds = selectedItemsInOrder.map((i) =>
    typeof i === "string" ? `col-${i}` : `divider-${i.id}`,
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
 * Uses columnItems when set (single source of truth); else columnOrder; else config.columns.
 */
export function getSelectedColumnsOrdered(
  config: Pick<
    InspectorBoundaryConfig,
    "columns" | "columnOrder" | "columnItems"
  >,
): string[] {
  const { columns, columnOrder, columnItems } = config;
  const columnsSet = new Set(columns ?? []);

  if (columnItems?.length) {
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
 */
export function getSelectedItemsOrdered(
  config: Pick<
    InspectorBoundaryConfig,
    "columns" | "columnOrder" | "columnItems"
  >,
  allColumnNames: string[],
): InspectorColumnItem[] {
  const { columns, columnItems } = config;
  const columnsSet = new Set(columns ?? []);
  const validColumns = (allColumnNames: string[]) =>
    allColumnNames.filter((c) => columnsSet.has(c));

  if (columnItems?.length && columnItems.some((i) => isDivider(i))) {
    return columnItems.filter(
      (i) =>
        typeof i === "string"
          ? columnsSet.has(i) && allColumnNames.includes(i)
          : true,
    );
  }
  const ordered = getSelectedColumnsOrdered(config);
  return ordered.filter((c) => allColumnNames.includes(c));
}

