import z from "zod";
import { areaSetCode, areaSetGroupCode } from "./AreaSet";
import { inspectorItemSchema } from "./shared";
import { pointSchema } from "./shared";

export type { InspectorItem, InspectorLabelDivider } from "./shared";

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

/**
 * Configuration for a single data source in the inspector.
 * - id / dataSourceId: identity
 * - name: user-friendly label
 * - InspectorItems: inspector-only display config per column and dividers
 * - layout: "single" (one column) or "twoColumn" grid
 * - icon: optional Lucide icon name
 * - color: optional Tailwind color token (e.g. "blue")
 */
export const inspectorDataSourceConfigSchema = z.object({
  id: z.string(),
  dataSourceId: z.string(),
  name: z.string(),
  inspectorItems: z.array(inspectorItemSchema).optional().nullable(),
  layout: z.enum(["single", "twoColumn"]).optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type InspectorDataSourceConfig = z.infer<
  typeof inspectorDataSourceConfigSchema
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
