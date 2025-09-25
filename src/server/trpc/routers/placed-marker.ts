import z from "zod";
import { placedMarkerSchema } from "@/server/models/PlacedMarker";
import {
  deletePlacedMarker,
  upsertPlacedMarker,
} from "@/server/repositories/PlacedMarker";
import { mapProcedure, router } from "..";

export const placedMarkerRouter = router({
  delete: mapProcedure
    .input(z.object({ placedMarkerId: z.string() }))
    .mutation(async ({ input }) => {
      return deletePlacedMarker(input.placedMarkerId);
    }),

  upsert: mapProcedure.input(placedMarkerSchema).mutation(async ({ input }) => {
    return upsertPlacedMarker(input);
  }),
});
