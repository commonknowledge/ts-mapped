import z from "zod";
import {
  deleteMapView,
  findMapViewsByMapId,
} from "@/server/repositories/MapView";
import { enqueue } from "@/server/services/queue";
import { mapWriteProcedure, router } from "../index";

export const mapViewRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteMapView(input.viewId);
      return true;
    }),
  saveToCrm: mapWriteProcedure.mutation(async ({ input }) => {
    const views = await findMapViewsByMapId(input.mapId);
    for (const view of views) {
      for (const dsv of view.dataSourceViews) {
        await enqueue("tagDataSource", dsv.dataSourceId, {
          dataSourceId: dsv.dataSourceId,
          viewId: view.id,
        });
      }
    }
    return true;
  }),
});
