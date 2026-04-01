import { v4 as uuidv4 } from "uuid";
import {
  type ColumnDef,
  type ColumnMetadata,
  ColumnSemanticType,
  ColumnType,
  type DefaultInspectorConfig,
} from "@/models/DataSource";
import { ColumnDisplayFormat, type InspectorItem } from "@/models/shared";
import type { InspectorConfig } from "../../hooks/useUpdateInspectorConfig";

export interface InspectorBlock {
  group?: string;
  columns: string[];
}

const SKIPPED_COLUMN_TYPES = new Set([ColumnType.Empty, ColumnType.Object]);

/**
 * Derive a default list of inspector items from a data source's column definitions
 * and metadata. Columns of type Empty or Object are excluded. Display format is
 * inferred from ColumnType and ColumnSemanticType.
 */
export function deriveInspectorItems(
  columnDefs: ColumnDef[],
  columnMetadata: ColumnMetadata[],
): InspectorItem[] {
  const metaByName = new Map(columnMetadata.map((m) => [m.name, m]));
  return columnDefs
    .filter((col) => !SKIPPED_COLUMN_TYPES.has(col.type))
    .map((col) => {
      let displayFormat: ColumnDisplayFormat;
      if (col.type === ColumnType.Number) {
        const sem = metaByName.get(col.name)?.semanticType;
        displayFormat =
          sem === ColumnSemanticType.Percentage01 ||
          sem === ColumnSemanticType.Percentage0100
            ? ColumnDisplayFormat.Percentage
            : ColumnDisplayFormat.Number;
      } else {
        displayFormat = ColumnDisplayFormat.Text;
      }
      return { type: "column" as const, name: col.name, displayFormat };
    });
}

/**
 * Build a default inspector config for a data source, deriving items and layout
 * from column definitions. Spreads any `defaultInspectorConfig` from the data source.
 */
export function buildDefaultInspectorConfig({
  dataSourceId,
  mapViewId,
  position,
  dataSource,
}: {
  dataSourceId: string;
  mapViewId: string;
  position: number;
  dataSource:
    | {
        name: string;
        columnDefs: ColumnDef[];
        columnMetadata: ColumnMetadata[];
        defaultInspectorConfig?: DefaultInspectorConfig | null;
      }
    | undefined;
}): InspectorConfig {
  const derivedItems = deriveInspectorItems(
    dataSource?.columnDefs ?? [],
    dataSource?.columnMetadata ?? [],
  );
  const derivedLayout = derivedItems.length > 4 ? "twoColumn" : null;

  return {
    id: uuidv4(),
    dataSourceId,
    mapViewId,
    position,
    name: dataSource?.name || "Data Source",
    description: null,
    icon: null,
    screenshotUrl: null,
    color: null,
    items: derivedItems,
    layout: derivedLayout,
    ...dataSource?.defaultInspectorConfig,
  };
}

/**
 * Group a flat array of inspector items into blocks separated by dividers.
 * Columns before the first divider form a block with no group label.
 */
export function buildInspectorBlocks(
  items: InspectorItem[] | null | undefined,
): InspectorBlock[] {
  const blocks: InspectorBlock[] = [];
  for (const item of items || []) {
    if (item.type === "divider") {
      blocks.push({ group: item.label, columns: [] });
    } else {
      const last = blocks[blocks.length - 1];
      if (last) {
        last.columns.push(item.name);
      } else {
        blocks.push({ columns: [item.name] });
      }
    }
  }
  return blocks;
}
