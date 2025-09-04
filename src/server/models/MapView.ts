import {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Updateable,
} from "kysely";
import z from "zod";
import { areaSetGroupCode } from "./AreaSet";

enum FilterOperator {
  AND = "AND",
  OR = "OR",
}
export const filterOperator = z.nativeEnum(FilterOperator);

export const filterTypes = ["GEO", "MULTI", "TEXT"] as const;

export enum FilterType {
  GEO = "GEO",
  MULTI = "MULTI",
  TEXT = "TEXT",
}
export const filterType = z.nativeEnum(FilterType);

const baseRecordFilterSchema = z.object({
  column: z.string().nullable(),
  dataRecordId: z.string().nullable(),
  dataSourceId: z.string().nullable(),
  distance: z.number().nullable(),
  label: z.string().nullable(),
  operator: filterOperator.nullable(),
  placedMarker: z.string().nullable(),
  search: z.string().nullable(),
  turf: z.string().nullable(),
  type: filterType,
});

type RecordFilterWithChildren = z.infer<typeof baseRecordFilterSchema> & {
  children?: RecordFilterWithChildren[] | undefined;
};

const recordFilterSchema: z.ZodType<RecordFilterWithChildren> =
  baseRecordFilterSchema.extend({
    children: z.lazy(() => recordFilterSchema.array()).optional(),
  });

export const sortSchema = z.object({
  name: z.string(),
  desc: z.boolean(),
});

const dataSourceViewSchema = z.object({
  dataSourceId: z.string(),
  filter: recordFilterSchema,
  search: z.string(),
  sort: z.array(sortSchema),
});

export const visualisationTypes = ["BoundaryOnly", "Choropleth"];
export enum VisualisationType {
  BoundaryOnly = "BoundaryOnly",
  Choropleth = "Choropleth",
}
export const visualisationType = z.nativeEnum(VisualisationType);

export const calculationTypes = ["Value", "Count", "Sum", "Average"];

export enum CalculationType {
  Value = "Value",
  Count = "Count",
  Sum = "Sum",
  Average = "Average",
}
export const calculationType = z.nativeEnum(CalculationType);

export const colorSchemes = [
  "RedBlue",
  "GreenYellowRed",
  "Viridis",
  "Plasma",
  "Diverging",
  "Sequential",
];
export enum ColorScheme {
  RedBlue = "RedBlue",
  GreenYellowRed = "GreenYellowRed",
  Viridis = "Viridis",
  Plasma = "Plasma",
  Diverging = "Diverging",
  Sequential = "Sequential",
}
export const colorScheme = z.nativeEnum(ColorScheme);

export const mapStyleNames = ["Light", "Dark", "Streets", "Satellite"];
export enum MapStyleName {
  Light = "Light",
  Dark = "Dark",
  Streets = "Streets",
  Satellite = "Satellite",
}
export const mapStyleName = z.nativeEnum(MapStyleName);

export const mapViewConfigSchema = z.object({
  areaDataSourceId: z.string(),
  areaDataColumn: z.string(),
  areaSetGroupCode: areaSetGroupCode,
  excludeColumnsString: z.string(),
  mapStyleName: mapStyleName,
  showBoundaryOutline: z.boolean(),
  showLabels: z.boolean(),
  showLocations: z.boolean(),
  showMembers: z.boolean(),
  showTurf: z.boolean(),
  visualisationType: visualisationType,
  calculationType: calculationType.nullable(),
  colorScheme: colorScheme.nullable(),
});
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

export type MapViewTable = MapView & {
  id: Generated<string>;
  createdAt: KyselyColumnType<Date, string | undefined, never>;
};

export type NewMapView = Insertable<MapViewTable>;
export type MapViewUpdate = Updateable<MapViewTable>;
