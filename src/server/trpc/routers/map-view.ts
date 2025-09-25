import z from "zod";
import {
  deleteMapView,
  findMapViewsByMapId,
} from "@/server/repositories/MapView";
import { enqueue } from "@/server/services/queue";
import { mapProcedure, router } from "../index";

export const mapViewRouter = router({
  delete: mapProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteMapView(input.viewId);
      return true;
    }),
  saveToCrm: mapProcedure.mutation(async ({ input }) => {
    const views = await findMapViewsByMapId(input.mapId);
    for (const view of views) {
      for (const dsv of view.dataSourceViews) {
        await enqueue("tagDataSource", {
          dataSourceId: dsv.dataSourceId,
          viewId: view.id,
        });
      }
    }
    return true;
  }),
});
