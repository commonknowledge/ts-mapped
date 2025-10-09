import z from "zod";
import { deleteMapView } from "@/server/repositories/MapView";
import { enqueue } from "@/server/services/queue";
import { dataSourceOwnerProcedure, mapWriteProcedure, router } from "../index";

export const mapViewRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteMapView(input.viewId);
      return true;
    }),
  tagRecordsWithViewName: dataSourceOwnerProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await enqueue("tagDataSource", ctx.dataSource.id, {
        dataSourceId: ctx.dataSource.id,
        viewId: input.viewId,
      });
      return true;
    }),
});
