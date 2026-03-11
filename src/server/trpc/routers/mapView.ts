import z from "zod";
import { deleteMapView } from "@/server/repositories/MapView";
import { enqueue } from "@/server/services/queue";
import { TAG_MAX_LENGTH, TAG_PREFIX } from "@/utils/tagName";
import { dataSourceOwnerProcedure, mapWriteProcedure, router } from "../index";

export const mapViewRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ viewId: z.string() }))
    .mutation(async ({ input }) => {
      await deleteMapView(input.viewId);
      return true;
    }),
  tagRecordsWithViewName: dataSourceOwnerProcedure
    .input(
      z.object({
        viewId: z.string(),
        columnName: z
          .string()
          .max(
            TAG_MAX_LENGTH,
            `Tag name must not exceed ${TAG_MAX_LENGTH} characters`,
          )
          .refine((name) => name.startsWith(TAG_PREFIX), {
            message: `Tag name must start with "${TAG_PREFIX}"`,
          }),
      }),
    )
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
