import z from "zod";
import { areaSetCode, areaSetGroupCode } from "./AreaSet";
import { CalculationType, pointSchema } from "./shared";

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

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export enum MarkerIconMode {
  None = "none",
  Categories = "categories",
}
export const markerIconModes = Object.values(MarkerIconMode);

export enum MarkerSizeMode {
  Fixed = "fixed",
  Scaled = "scaled",
}
export const markerSizeModes = Object.values(MarkerSizeMode);

export enum MarkerColorMode {
  Single = "single",
  Categories = "categories",
}
export const markerColorModes = Object.values(MarkerColorMode);

export const markerVisualisationSchema = z.object({
  iconMode: z.nativeEnum(MarkerIconMode).optional(),
  iconColumn: z.string().optional(),
  // Column value -> shape name (see marker icon sprites)
  categoryIcons: z.record(z.string(), z.string()).optional(),
  sizeMode: z.nativeEnum(MarkerSizeMode).optional(),
  sizeColumn: z.string().optional(),
  sizeSortDesc: z.boolean().optional(),
  colorMode: z.nativeEnum(MarkerColorMode).optional(),
  colorColumn: z.string().optional(),
  opacityPct: z.number().min(0).max(100).optional(),
  showLabels: z.boolean().optional(),
  legend: z
    .object({ show: z.boolean(), display: z.array(z.string()) })
    .optional(),
});

export type MarkerVisualisation = z.infer<typeof markerVisualisationSchema>;

export const mapViewConfigSchema = z.object({
  areaDataSourceId: z.string(),
  areaDataColumn: z.string(),
  areaDataSecondaryColumn: z.string().optional(),
  areaSetGroupCode: areaSetGroupCode.nullish(),
  secondaryAreaSetCode: areaSetCode.nullish(),
  secondaryBoundaryStrokeColor: z.string().nullish(),
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
  calculationType: z.nativeEnum(CalculationType).default(CalculationType.Avg),
  colorScheme: z.nativeEnum(ColorScheme).nullish(),
  reverseColorScheme: z.boolean().nullish(),
  colorMappings: z.record(z.string(), z.string()).optional(),
  colorScaleType: z.nativeEnum(ColorScaleType).optional(),
  steppedColorStepsByKey: z
    .record(z.string(), z.array(steppedColorStepSchema))
    .optional(),
  customColor: z.string().optional(),
  hideFilteredMarkers: z.boolean().optional(),
  // Plain layer colour per marker data source id (migrated from map config)
  markerColors: z.record(z.string(), hexColorSchema).optional(),
  // Column-driven marker styling per marker data source id
  markerVisualisations: z
    .record(z.string(), markerVisualisationSchema)
    .optional(),
});

export type MapViewConfig = z.infer<typeof mapViewConfigSchema>;

export const mapViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  config: mapViewConfigSchema,
  dataSourceViews: z.array(dataSourceViewSchema),
  position: z.number(),
  mapId: z.string(),
  createdAt: z.date(),
});

export type MapView = z.infer<typeof mapViewSchema>;
