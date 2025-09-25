import z from "zod";
import { boundingBoxSchema } from "@/server/models/Area";
import { CalculationType } from "@/server/models/MapView";
import { getAreaStats } from "@/server/stats";
import { dataSourceProcedure, router } from "../index";

export const areaRouter = router({
  stats: dataSourceProcedure
    .input(
      z.object({
        areaSetCode: z.string(),
        calculationType: z.nativeEnum(CalculationType),
        column: z.string(),
        excludeColumns: z.array(z.string()),
        boundingBox: boundingBoxSchema.nullable(),
      }),
    )
    .query(({ input }) => {
      return getAreaStats(
        input.areaSetCode,
        input.dataSourceId,
        input.calculationType,
        input.column,
        input.excludeColumns,
        input.boundingBox,
      );
    }),
});
