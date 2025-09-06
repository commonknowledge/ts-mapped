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

export enum VisualisationType {
  BoundaryOnly = "BoundaryOnly",
  Choropleth = "Choropleth",
}
export const visualisationTypes = Object.values(VisualisationType);

export enum CalculationType {
  Value = "Value",
  Count = "Count",
  Sum = "Sum",
  Average = "Average",
}
export const calculationTypes = Object.values(CalculationType);

export enum ColorScheme {
  RedBlue = "RedBlue",
  GreenYellowRed = "GreenYellowRed",
  Viridis = "Viridis",
  Plasma = "Plasma",
  Diverging = "Diverging",
  Sequential = "Sequential",
}
export const colorSchemes = Object.values(ColorScheme);

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
  areaSetGroupCode: areaSetGroupCode.nullish(),
  excludeColumnsString: z.string(),
  mapStyleName: z.nativeEnum(MapStyleName),
  showBoundaryOutline: z.boolean(),
  showLabels: z.boolean(),
  showLocations: z.boolean(),
  showMembers: z.boolean(),
  showTurf: z.boolean(),
  visualisationType: z.nativeEnum(VisualisationType).nullish(),
  calculationType: z.nativeEnum(CalculationType).nullish(),
  colorScheme: z.nativeEnum(ColorScheme).nullish(),
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
