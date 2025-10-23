import z from "zod";
import { turfSchema } from "@/server/models/Turf";
import { deleteTurf, upsertTurf } from "@/server/repositories/Turf";
import { mapWriteProcedure, router } from "..";

export const turfRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ turfId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteTurf(input.turfId);
      return true;
    }),

  upsert: mapWriteProcedure
    .input(turfSchema.omit({ createdAt: true }))
    .mutation(({ input }) => {
      return upsertTurf(input);
    }),
});
