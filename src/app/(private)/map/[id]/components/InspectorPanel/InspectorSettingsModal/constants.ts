import { ColumnDisplayFormat } from "@/models/shared";

export const SELECTED_DROPPABLE_ID = "selected-columns";
export const AVAILABLE_DROPPABLE_ID = "available-columns";
/** Droppable id for the left column's "Selected" section (reorder selected items). */
export const SELECTED_LEFT_DROPPABLE_ID = "selected-left-section";

export type InspectorLayout = "single" | "twoColumn";

/** Infer column format from name: Percentage if name contains % or "percentage". */
export function inferFormat(
  columnName: string,
): ColumnDisplayFormat | undefined {
  const lower = columnName.toLowerCase();
  if (lower.includes("%") || lower.includes("percentage"))
    return ColumnDisplayFormat.Percentage;
  return undefined;
}
