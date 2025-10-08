import z from "zod";
import { placedMarkerSchema } from "@/server/models/PlacedMarker";
import {
  deletePlacedMarker,
  upsertPlacedMarker,
} from "@/server/repositories/PlacedMarker";
import { mapWriteProcedure, router } from "..";

export const placedMarkerRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ placedMarkerId: z.string() }))
    .mutation(async ({ input }) => {
      await deletePlacedMarker(input.placedMarkerId);
      return true;
    }),

  upsert: mapWriteProcedure
    .input(placedMarkerSchema)
    .mutation(async ({ input }) => {
      return upsertPlacedMarker(input);
    }),
});
