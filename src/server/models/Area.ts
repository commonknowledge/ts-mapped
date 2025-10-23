import z from "zod";
import type { Generated, Insertable, Updateable } from "kysely";

export const areaGeographySchema = z.union([
  z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }),
  z.object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
  }),
]);

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
};
export type NewArea = Insertable<AreaTable>;
export type AreaUpdate = Updateable<AreaTable>;
