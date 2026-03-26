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
  displayFormat: z.nativeEnum(ColumnDisplayFormat).optional(),
  scaleMax: z.number().int().min(2).max(10).optional(),
  barColor: z.string().optional(),
  comparisonStat: z.nativeEnum(InspectorComparisonStat).optional(),
});
export type InspectorColumn = z.infer<typeof inspectorColumnSchema>;

export const inspectorLabelDividerSchema = z.object({
  type: z.literal("divider"),
  id: z.string(),
  label: z.string(),
});
export type InspectorLabelDivider = z.infer<typeof inspectorLabelDividerSchema>;

export const inspectorColumnItemSchema = z.union([
  inspectorColumnSchema.extend({ type: z.literal("column") }),
  inspectorLabelDividerSchema,
]);
export type InspectorColumnItem = z.infer<typeof inspectorColumnItemSchema>;
