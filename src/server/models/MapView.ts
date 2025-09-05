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
  column: z.string().optional().nullable(),
  dataRecordId: z.string().optional().nullable(),
  dataSourceId: z.string().optional().nullable(),
  distance: z.number().optional().nullable(),
  label: z.string().optional().nullable(),
  operator: filterOperator.optional().nullable(),
  placedMarker: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
  turf: z.string().optional().nullable(),
  type: filterType,
});

type RecordFilterWithChildren = z.infer<typeof baseRecordFilterSchema> & {
  children?: RecordFilterWithChildren[] | null;
};

const recordFilterSchema: z.ZodType<RecordFilterWithChildren> =
  baseRecordFilterSchema.extend({
    children: z
      .lazy(() => recordFilterSchema.array())
      .optional()
      .nullable(),
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
  areaSetGroupCode: areaSetGroupCode.optional().nullable(),
  excludeColumnsString: z.string(),
  mapStyleName: mapStyleName,
  showBoundaryOutline: z.boolean(),
  showLabels: z.boolean(),
  showLocations: z.boolean(),
  showMembers: z.boolean(),
  showTurf: z.boolean(),
  visualisationType: visualisationType.optional().nullable(),
  calculationType: calculationType.optional().nullable(),
  colorScheme: colorScheme.optional().nullable(),
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
