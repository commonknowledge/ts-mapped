import z from "zod";
import type { ColumnType, Generated, Insertable, Updateable } from "kysely";

export enum MarkerDisplayMode {
  Clusters = "clusters",
  Heatmap = "heatmap",
}

export const mapConfigSchema = z.object({
  markerDataSourceIds: z.array(z.string()),
  membersDataSourceId: z.string().nullish(),
  markerDisplayModes: z.record(z.nativeEnum(MarkerDisplayMode)).optional(),
  markerColors: z.record(z.string()).optional(),
  placedMarkerColors: z.record(z.string()).optional(),
});

export type MapConfig = z.infer<typeof mapConfigSchema>;

export const mapSchema = z.object({
  id: z.string(),
  name: z.string(),
  organisationId: z.string(),
  imageUrl: z.string().nullish(),
  config: mapConfigSchema,
  createdAt: z.date(),
});

export type Map = z.infer<typeof mapSchema>;

export type MapTable = Map & {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
};
export type NewMap = Insertable<MapTable>;
export type MapUpdate = Updateable<MapTable>;
