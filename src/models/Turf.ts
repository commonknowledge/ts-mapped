import z from "zod";

export const polygonSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.array(z.number()))),
});

export const multiPolygonSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(z.array(z.number())))),
});

export const polygonOrMultiPolygonSchema = z.union([
  polygonSchema,
  multiPolygonSchema,
]);

export type Polygon = z.infer<typeof polygonSchema>;
export type MultiPolygon = z.infer<typeof multiPolygonSchema>;
export type PolygonOrMultiPolygon = z.infer<typeof polygonOrMultiPolygonSchema>;

export const turfSchema = z.object({
  id: z.string(),
  label: z.string(),
  notes: z.string(),
  area: z.number(),
  polygon: polygonOrMultiPolygonSchema,
  mapId: z.string(),
  createdAt: z.date(),
  color: z.string().nullish(),
  folderId: z.string().nullish(),
  position: z.number(),
});

export type Turf = z.infer<typeof turfSchema>;
