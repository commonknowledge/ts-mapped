import z from "zod";
import { areaSetCode, areaSetGroupCode } from "./AreaSet";
import { inspectorColumnSchema } from "./inspectorColumn";
import { pointSchema } from "./shared";

export enum FilterOperator {
  AND = "AND",
  OR = "OR",
}

export const filterOperators = Object.values(FilterOperator);

export enum FilterType {
  EMPTY = "EMPTY",
  EXACT = "EXACT",
  GEO = "GEO",
  MULTI = "MULTI",
  NOT_EMPTY = "NOT_EMPTY",
  TEXT = "TEXT",
}

export const filterTypes = Object.values(FilterType);

export const columnFilterTypes = [
  FilterType.TEXT,
  FilterType.EXACT,
  FilterType.EMPTY,
  FilterType.NOT_EMPTY,
] as const;

const baseRecordFilterSchema = z.object({
  column: z.string().nullish(),
  dataRecordId: z.string().nullish(),
  dataSourceId: z.string().nullish(),
  distance: z.number().nullish(),
  label: z.string().nullish(),
  operator: z.nativeEnum(FilterOperator).nullish(),
  placedMarker: z.string().nullish(),
  search: z.string().nullish(),
  turf: z.string().nullish(),
  type: z.nativeEnum(FilterType),
});

type RecordFilterWithChildren = z.infer<typeof baseRecordFilterSchema> & {
  children?: RecordFilterWithChildren[] | null;
};

export const recordFilterSchema: z.ZodType<RecordFilterWithChildren> =
  baseRecordFilterSchema.extend({
    children: z
      .lazy(() => recordFilterSchema.array())
      .optional()
      .nullable(),
  });

export type RecordFilterInput = z.infer<typeof recordFilterSchema>;

export const recordSortSchema = z.object({
  name: z.string(),
  desc: z.boolean(),
  location: pointSchema.nullish(),
});

export type SortInput = z.infer<typeof recordSortSchema>;

export const dataSourceViewSchema = z.object({
  dataSourceId: z.string(),
  filter: recordFilterSchema,
  search: z.string(),
  sort: z.array(recordSortSchema),
});

export type DataSourceView = z.infer<typeof dataSourceViewSchema>;

export enum CalculationType {
  Count = "Count",
  Sum = "Sum",
  Avg = "Avg",
  Mode = "Mode",
}
export const calculationTypes = Object.values(CalculationType);
export const calculationType = z.nativeEnum(CalculationType);
export const DEFAULT_CALCULATION_TYPE = CalculationType.Avg;

export enum ColorScheme {
  RedBlue = "RedBlue",
  GreenYellowRed = "GreenYellowRed",
  Viridis = "Viridis",
  Plasma = "Plasma",
  Diverging = "Diverging",
  Sequential = "Sequential",
  Custom = "Custom",
}
export const colorSchemes = Object.values(ColorScheme);

export enum ColorScaleType {
  Categorical = "Categorical",
  Gradient = "Gradient",
  Stepped = "Stepped",
}
export const colorScaleTypes = Object.values(ColorScaleType);

export enum MapType {
  Geo = "Geo",
  Hex = "Hex",
}
export const mapTypes = Object.values(MapType);

export enum MapStyleName {
  Light = "Light",
  Dark = "Dark",
  Streets = "Streets",
  Satellite = "Satellite",
}
export const mapStyleNames = Object.values(MapStyleName);

export const steppedColorStepSchema = z.object({
  start: z.number(),
  end: z.number(),
});

export type SteppedColorStep = z.infer<typeof steppedColorStepSchema>;

export const mapViewConfigSchema = z.object({
  areaDataSourceId: z.string(),
  areaDataColumn: z.string(),
  areaDataSecondaryColumn: z.string().optional(),
  areaSetGroupCode: areaSetGroupCode.nullish(),
  secondaryAreaSetCode: areaSetCode.nullish(),
  choroplethOpacityPct: z.number().optional(),
  includeColumnsString: z.string().optional(),
  mapStyleName: z.nativeEnum(MapStyleName),
  mapType: z.nativeEnum(MapType).optional(),
  showBoundaryOutline: z.boolean(),
  showChoropleth: z.boolean().optional(),
  showLabels: z.boolean(),
  showLocations: z.boolean(),
  showMembers: z.boolean(),
  showTurf: z.boolean(),
  calculationType: z.nativeEnum(CalculationType).nullish(),
  colorScheme: z.nativeEnum(ColorScheme).nullish(),
  reverseColorScheme: z.boolean().nullish(),
  colorMappings: z.record(z.string(), z.string()).optional(),
  colorScaleType: z.nativeEnum(ColorScaleType).optional(),
  steppedColorStepsByKey: z
    .record(z.string(), z.array(steppedColorStepSchema))
    .optional(),
  customColor: z.string().optional(),
  hideFilteredMarkers: z.boolean().optional(),
});

export type MapViewConfig = z.infer<typeof mapViewConfigSchema>;

// ============================================================================
// INSPECTOR CONFIGURATION
// ============================================================================
// Configures which data sources and columns are displayed in the inspector panel
// for different aspects (boundaries, markers, members, etc.)

export enum InspectorDataSourceConfigType {
  Simple = "simple",
}
export const inspectorDataSourceTypes = Object.values(
  InspectorDataSourceConfigType,
);

/**
 * How to display a column value in the inspector.
 * - text: plain string
 * - number: formatted number
 * - percentage: progress bar
 * - scale: N thin filled/grey bars
 * - numberWithComparison: number plus variance % vs a chosen statistic
 */
export const inspectorColumnFormatSchema = z.enum([
  "text",
  "number",
  "percentage",
  "scale",
  "numberWithComparison",
]);
export type InspectorColumnFormat = z.infer<typeof inspectorColumnFormatSchema>;

/** Statistic used as baseline for "number with comparison" format. */
export const inspectorComparisonStatSchema = z.enum([
  "average",
  "median",
  "min",
  "max",
]);
export type InspectorComparisonStat = z.infer<
  typeof inspectorComparisonStatSchema
>;

/** Display metadata for a single column in the inspector. */
export const inspectorColumnMetaSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  format: inspectorColumnFormatSchema.optional(),
  scaleMax: z.number().int().min(2).max(10).optional(),
  barColor: z.string().optional(),
  comparisonStat: inspectorComparisonStatSchema.optional(),
});
export type InspectorColumnMeta = z.infer<typeof inspectorColumnMetaSchema>;

/** A group of columns shown under one heading in the inspector. */
export const inspectorColumnGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  columnNames: z.array(z.string()),
});
export type InspectorColumnGroup = z.infer<typeof inspectorColumnGroupSchema>;

/** Label divider: a visual separator that groups columns. */
export const inspectorLabelDividerSchema = z.object({
  type: z.literal("divider"),
  id: z.string(),
  label: z.string(),
});
export type InspectorLabelDivider = z.infer<typeof inspectorLabelDividerSchema>;

export const inspectorColumnItemSchema = z.union([
  z.string(),
  inspectorLabelDividerSchema,
]);
export type InspectorColumnItem = z.infer<typeof inspectorColumnItemSchema>;

/**
 * Configuration for a single data source in the inspector.
 * - id / dataSourceId: identity
 * - name: user-friendly label
 * - type: display variant (currently only "simple")
 * - columns: ordered column names to display
 * - columnOrder: full column order (used for Available list order)
 * - columnItems: ordered columns + label dividers
 * - columnMetadata: per-column display settings (InspectorDataSourceConfig-level overrides)
 * - columnGroups: optional column grouping under headings
 * - inspectorColumns: inspector-only display config per column
 * - layout: "single" (one column) or "twoColumn" grid
 * - icon: optional Lucide icon name
 * - color: optional Tailwind color token (e.g. "blue")
 */
export const inspectorDataSourceConfigSchema = z.object({
  id: z.string(),
  dataSourceId: z.string(),
  name: z.string(),
  type: z.nativeEnum(InspectorDataSourceConfigType).optional(),
  columns: z.array(z.string()),
  columnOrder: z.array(z.string()).optional().nullable(),
  columnItems: z.array(inspectorColumnItemSchema).optional().nullable(),
  columnMetadata: z
    .record(z.string(), inspectorColumnMetaSchema)
    .optional()
    .nullable(),
  columnGroups: z.array(inspectorColumnGroupSchema).optional().nullable(),
  inspectorColumns: z.array(inspectorColumnSchema).optional().nullable(),
  layout: z.enum(["single", "twoColumn"]).optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type InspectorDataSourceConfig = z.infer<
  typeof inspectorDataSourceConfigSchema
>;

/**
 * Template stored on a data source for default inspector settings.
 * Applied when adding the data source to a map view's inspector.
 * Omits id and dataSourceId (set at that time).
 */
export const defaultInspectorDataSourceConfigSchema =
  inspectorDataSourceConfigSchema.omit({
    id: true,
    dataSourceId: true,
  });
export type DefaultInspectorDataSourceConfig = z.infer<
  typeof defaultInspectorDataSourceConfigSchema
>;

/**
 * Complete inspector configuration for a map view.
 */
export const inspectorConfigSchema = z.object({
  dataSources: z.array(inspectorDataSourceConfigSchema).optional(),
  // Future: markers, members, etc.
});

export type InspectorConfig = z.infer<typeof inspectorConfigSchema>;

// ============================================================================
// END INSPECTOR CONFIGURATION
// ============================================================================

export const mapViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  config: mapViewConfigSchema,
  dataSourceViews: z.array(dataSourceViewSchema),
  inspectorConfig: inspectorConfigSchema.nullish(),
  position: z.number(),
  mapId: z.string(),
  createdAt: z.date(),
});

export type MapView = z.infer<typeof mapViewSchema>;
