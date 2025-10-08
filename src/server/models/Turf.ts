import z from "zod";
import type { Generated, Insertable, Updateable } from "kysely";

export const polygonSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.array(z.number()))),
});

export type Polygon = z.infer<typeof polygonSchema>;

export const turfSchema = z.object({
  id: z.string(),
  label: z.string(),
  notes: z.string(),
  area: z.number(),
  polygon: polygonSchema,
  mapId: z.string(),
  createdAt: z.date(),
});

export type Turf = z.infer<typeof turfSchema>;
export type TurfTable = Turf & {
  id: Generated<string>;
};

export type NewTurf = Insertable<TurfTable>;
export type TurfUpdate = Updateable<TurfTable>;
