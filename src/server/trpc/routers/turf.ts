import z from "zod";
import { turfSchema } from "@/server/models/Turf";
import { deleteTurf, insertTurf, updateTurf } from "@/server/repositories/Turf";
import { mapWriteProcedure, router } from "..";

export const turfRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ turfId: z.string() }))
    .mutation(async ({ input }) => {
      return deleteTurf(input.turfId);
    }),

  upsert: mapWriteProcedure
    .input(turfSchema.omit({ id: true }).extend({ id: z.string().optional() }))
    .mutation(async ({ input }) => {
      let turf = null;
      if (input.id) {
        turf = await updateTurf(input.id, input);
      } else {
        turf = await insertTurf(input);
      }
      return turf;
    }),
});
