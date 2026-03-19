import z from "zod";

export const pointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type Point = z.infer<typeof pointSchema>;

export const geocodeResultSchema = z.object({
  areas: z.record(z.string(), z.string()),
  centralPoint: pointSchema.nullable(),
  samplePoint: pointSchema.nullable(),
});

export type GeocodeResult = z.infer<typeof geocodeResultSchema>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);
