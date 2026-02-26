import z from "zod";
import { areaSetCode, areaSetGroupCode } from "./AreaSet";
import { pointSchema } from "./shared";
import type {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Updateable,
} from "kysely";

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
  areaDataNullIsZero: z.boolean().optional(),
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
  categoryColors: z.record(z.string(), z.string()).optional(),
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

/**
 * Types of inspector boundary configurations
 * - simple: Basic display of selected columns from data sources
 */
export enum InspectorBoundaryConfigType {
  Simple = "simple",
}
export const inspectorBoundaryTypes = Object.values(
  InspectorBoundaryConfigType,
);

/**
 * How to display a column value in the inspector
 * - text: plain string
 * - number: formatted number
 * - percentage: 0–100 (or 0–1) shown as progress bar
 * - scale: integer 0..scaleMax-1 (or 1..scaleMax), shown as N thin filled/grey bars
 */
export const inspectorColumnFormatSchema = z.enum([
  "text",
  "number",
  "percentage",
  "scale",
]);
export type InspectorColumnFormat = z.infer<typeof inspectorColumnFormatSchema>;

/**
 * Display metadata for a single column (label, format, scale size, bar colour)
 */
export const inspectorColumnMetaSchema = z.object({
  displayName: z.string().optional(),
  format: inspectorColumnFormatSchema.optional(),
  /** For format "scale": max value (e.g. 3 for a 0–2 or 1–3 scale). Number of bars shown. */
  scaleMax: z.number().int().min(2).max(10).optional(),
  /** Bar colour (CSS color) for percentage/scale bars. Empty = primary. */
  barColor: z.string().optional(),
});
export type InspectorColumnMeta = z.infer<typeof inspectorColumnMetaSchema>;

/**
 * A group of columns shown under one heading in the inspector
 */
export const inspectorColumnGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  columnNames: z.array(z.string()),
});
export type InspectorColumnGroup = z.infer<typeof inspectorColumnGroupSchema>;

/**
 * Label divider: a visual separator that groups columns. Spans two cols when grid layout is on.
 */
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
 * Configuration for a single boundary data source in the inspector
 * - dataSourceId: Reference to the data source
 * - name: User-friendly name for this inspector config
 * - type: The type of inspector display (currently only "simple")
 * - columns: Ordered array of column names to display
 * - columnMetadata: Optional display names per column
 * - columnGroups: Optional groups for visual grouping (columns appear under group label)
 * - layout: "single" (one column) or "twoColumn" (Airtable-style grid)
 * - icon: optional Lucide icon name for custom panel icon
 * - color: optional Tailwind color name for panel background (e.g. "blue" -> bg-blue-50)
 * - columnOrder: optional display order for all columns (used for Available list order; when set, reorderable)
 */
export const inspectorBoundaryConfigSchema = z.object({
  id: z.string(),
  dataSourceId: z.string(),
  name: z.string(),
  type: z.nativeEnum(InspectorBoundaryConfigType),
  columns: z.array(z.string()),
  /** When set, order of "Available" list; full list of column names in desired order. */
  columnOrder: z.array(z.string()).optional().nullable(),
  /** Ordered list of columns and label dividers. When set, used for display order; columns derived from it. */
  columnItems: z.array(inspectorColumnItemSchema).optional().nullable(),
  columnMetadata: z
    .record(z.string(), inspectorColumnMetaSchema)
    .optional()
    .nullable(),
  columnGroups: z.array(inspectorColumnGroupSchema).optional().nullable(),
  layout: z.enum(["single", "twoColumn"]).optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type InspectorBoundaryConfig = z.infer<
  typeof inspectorBoundaryConfigSchema
>;

/**
 * Complete inspector configuration for a map view
 * Organized by aspect (boundaries, markers, members, etc.)
 */
export const inspectorConfigSchema = z.object({
  boundaries: z.array(inspectorBoundaryConfigSchema).optional(),
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

export type MapViewTable = MapView & {
  id: Generated<string>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
};

export type NewMapView = Insertable<MapViewTable>;
export type MapViewUpdate = Updateable<MapViewTable>;
