import z from "zod";

export const pointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type Point = z.infer<typeof pointSchema>;
