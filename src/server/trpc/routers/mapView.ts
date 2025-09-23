import z from "zod";
import { deleteMapView } from "@/server/repositories/MapView";
import { mapProcedure, router } from "../index";

export const mapViewRouter = router({
  delete: mapProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteMapView(input.viewId);
      return true;
    }),
});
