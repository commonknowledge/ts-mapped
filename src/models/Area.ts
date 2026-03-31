import z from "zod";

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

export type AreaGeography = z.infer<typeof areaGeographySchema>;

export function parseAreaGeography(geoJSON: string): AreaGeography {
  return JSON.parse(geoJSON) as AreaGeography;
}

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
