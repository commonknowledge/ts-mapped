import type { InspectorColumnFormat } from "@/server/models/MapView";

export const SELECTED_DROPPABLE_ID = "selected-columns";
export const AVAILABLE_DROPPABLE_ID = "available-columns";
/** Sentinel for Select default option (Radix Select.Item cannot have value="") */
export const DEFAULT_SELECT_VALUE = "__default__";

export type InspectorLayout = "single" | "twoColumn";

/** Infer column format from name: Percentage if name contains % or "percentage". */
export function inferFormat(
  columnName: string,
): InspectorColumnFormat | undefined {
  const lower = columnName.toLowerCase();
  if (lower.includes("%") || lower.includes("percentage")) return "percentage";
  return undefined;
}
