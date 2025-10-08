import z from "zod";
import { boundingBoxSchema } from "@/server/models/Area";
import { AreaSetCode } from "@/server/models/AreaSet";
import { CalculationType } from "@/server/models/MapView";
import { getAreaStats } from "@/server/stats";
import { dataSourceReadProcedure, router } from "../index";

export const areaRouter = router({
  stats: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: z.nativeEnum(AreaSetCode),
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
