import z from "zod";
import { deleteMapView } from "@/server/repositories/MapView";
import { mapWriteProcedure, router } from "../index";

export const mapViewRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteMapView(input.viewId);
      return true;
    }),
});
