import {
  Generated,
  Insertable,
  ColumnType as KyselyColumnType,
  Updateable,
} from "kysely";
import z from "zod";

export const filterTypes = ["GEO", "MULTI", "TEXT"] as const;
export const filterType = z.enum(filterTypes);

const baseRecordFilterSchema = z.object({
  column: z.string().nullable(),
  dataRecordId: z.string().nullable(),
  dataSourceId: z.string().nullable(),
  distance: z.number().nullable(),
  label: z.string().nullable(),
  operator: z.string().nullable(),
  placedMarker: z.string().nullable(),
  search: z.string().nullable(),
  turf: z.string().nullable(),
  type: filterType,
});

type RecordFilterWithChildren = z.infer<typeof baseRecordFilterSchema> & {
  children: RecordFilterWithChildren[] | null;
};

const recordFilterSchema: z.ZodType<RecordFilterWithChildren> =
  baseRecordFilterSchema.extend({
    children: z.lazy(() => recordFilterSchema.array()).nullable(),
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

const mapViewConfigSchema = z.object({
  areaDataSourceId: z.string(),
  areaDataColumn: z.string(),
  areaSetGroupCode: z.string(),
  excludeColumnsString: z.string(),
  mapStyleName: z.string(),
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
