import z from "zod";
import type { Generated, Insertable, JSONColumnType, Updateable } from "kysely";

export const areaGeographySchema = z.record(z.string(), z.unknown());

export const boundingBoxSchema = z.object({
  north: z.number(),
  east: z.number(),
  south: z.number(),
  west: z.number(),
});

export type BoundingBox = z.infer<typeof boundingBoxSchema>;

export const areaStatSchema = z.object({
  areaCode: z.string(),
  value: z.unknown(),
});

export type AreaStat = z.infer<typeof areaStatSchema>;

export const areaSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  geography: areaGeographySchema,
  areaSetId: z.number(),
});

export type Area = z.infer<typeof areaSchema>;

export type AreaTable = Area & {
  id: Generated<number>;
  geography: JSONColumnType<object>;
};
export type NewArea = Insertable<AreaTable>;
export type AreaUpdate = Updateable<AreaTable>;
