import type { InspectorColumn, InspectorItem } from "@/models/shared";

export interface InspectorBlock {
  group?: string;
  columns: InspectorColumn[];
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
        last.columns.push(item);
      } else {
        blocks.push({ columns: [item] });
      }
    }
  }
  return blocks;
}
