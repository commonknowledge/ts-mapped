import z from "zod";

/** Point */

export const pointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type Point = z.infer<typeof pointSchema>;

/** Inspector columns */

export enum ColumnDisplayFormat {
  Text = "Text",
  Number = "Number",
  Percentage = "Percentage",
  Scale = "Scale",
  NumberWithComparison = "NumberWithComparison",
  Boolean = "Boolean",
  LargeText = "LargeText",
}

export const columnDisplayFormats = Object.values(ColumnDisplayFormat);

export enum InspectorComparisonStat {
  Average = "Average",
  Median = "Median",
  Min = "Min",
  Max = "Max",
}

export const inspectorColumnSchema = z.object({
  name: z.string(),
  displayFormat: z.enum(ColumnDisplayFormat).optional(),
  scaleMax: z.number().int().min(2).max(10).optional(),
  barColor: z.string().optional(),
  comparisonStat: z.enum(InspectorComparisonStat).optional(),
  // Shown as a key figure tile above the section's other columns
  pinned: z.boolean().optional(),
});
export type InspectorColumn = z.infer<typeof inspectorColumnSchema>;

export const inspectorLabelDividerSchema = z.object({
  type: z.literal("divider"),
  id: z.string(),
  label: z.string(),
  // How the columns under it show: as rows (the default), or together as
  // one bar chart, largest first. "chartEnd" closes a chart: it draws
  // nothing, and the columns after it show as rows again.
  display: z.enum(["list", "barChart", "chartEnd"]).optional(),
});
export type InspectorLabelDivider = z.infer<typeof inspectorLabelDividerSchema>;

export const inspectorItemSchema = z.union([
  inspectorColumnSchema.extend({ type: z.literal("column") }),
  inspectorLabelDividerSchema,
]);
export type InspectorItem = z.infer<typeof inspectorItemSchema>;

/** Choropleth */

export enum CalculationType {
  Sum = "Sum",
  Avg = "Avg",
  Mode = "Mode",
}
export const calculationTypes = Object.values(CalculationType);
export const calculationType = z.enum(CalculationType);
export const DEFAULT_CALCULATION_TYPE = CalculationType.Avg;
