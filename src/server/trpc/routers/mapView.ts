import z from "zod";
import { inspectorDataSourceConfigSchema } from "@/models/InspectorDataSourceConfig";
import {
  findByMapViewId,
  replaceAllForMapView,
} from "@/server/repositories/InspectorDataSourceConfig";
import { deleteMapView } from "@/server/repositories/MapView";
import { enqueue } from "@/server/services/queue";
import {
  dataSourceOwnerProcedure,
  mapReadProcedure,
  mapWriteProcedure,
  router,
} from "../index";

export const mapViewRouter = router({
  inspectorConfigs: mapReadProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ input }) => {
      return findByMapViewId(input.viewId);
    }),

  updateInspectorConfigs: mapWriteProcedure
    .input(
      z.object({
        viewId: z.string(),
        configs: z.array(
          inspectorDataSourceConfigSchema.omit({
            mapViewId: true,
            position: true,
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const configs = input.configs.map((config, index) => ({
        ...config,
        mapViewId: input.viewId,
        position: index,
      }));
      await replaceAllForMapView({ mapViewId: input.viewId, configs });
      return true;
    }),

  delete: mapWriteProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteMapView(input.viewId);
      return true;
    }),
  tagRecordsWithViewName: dataSourceOwnerProcedure
    .input(z.object({ viewId: z.string(), columnName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await enqueue(
        "tagDataSource",
        `${ctx.dataSource.id}-${input.viewId}-${input.columnName}`,
        {
          dataSourceId: ctx.dataSource.id,
          viewId: input.viewId,
          columnName: input.columnName,
          userEmail: ctx.user.email,
        },
      );
      return true;
    }),
});
