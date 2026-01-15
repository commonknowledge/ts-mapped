import z from "zod";
import { areaSetGroupCode } from "./AreaSet";
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
  GEO = "GEO",
  MULTI = "MULTI",
  TEXT = "TEXT",
}

export const filterTypes = Object.values(FilterType);

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
}
export const calculationTypes = Object.values(CalculationType);
export const calculationType = z.nativeEnum(CalculationType);

export enum ColorScheme {
  RedBlue = "RedBlue",
  GreenYellowRed = "GreenYellowRed",
  Viridis = "Viridis",
  Plasma = "Plasma",
  Diverging = "Diverging",
  Sequential = "Sequential",
}
export const colorSchemes = Object.values(ColorScheme);

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

export const mapViewConfigSchema = z.object({
  areaDataSourceId: z.string(),
  areaDataColumn: z.string(),
  areaDataSecondaryColumn: z.string().optional(),
  areaDataNullIsZero: z.boolean().optional(),
  areaSetGroupCode: areaSetGroupCode.nullish(),
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
 * Configuration for a single boundary data source in the inspector
 * - dataSourceId: Reference to the data source
 * - name: User-friendly name for this inspector config
 * - type: The type of inspector display (currently only "simple")
 * - columns: Array of column names to display from this data source
 */
export const inspectorBoundaryConfigSchema = z.object({
  dataSourceId: z.string(),
  name: z.string(),
  type: z.nativeEnum(InspectorBoundaryConfigType),
  columns: z.array(z.string()),
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
  inspectorConfig: inspectorConfigSchema.optional(),
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
