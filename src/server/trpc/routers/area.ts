import z from "zod";
import { boundingBoxSchema } from "@/server/models/Area";
import { AreaSetCode } from "@/server/models/AreaSet";
import { CalculationType } from "@/server/models/MapView";
import { findAreaByCodeWithGeometry } from "@/server/repositories/Area";
import { getAreaStats } from "@/server/stats";
import { dataSourceReadProcedure, protectedProcedure, router } from "../index";

export const areaRouter = router({
  byCode: protectedProcedure
    .input(
      z.object({
        areaSetCode: z.nativeEnum(AreaSetCode),
        code: z.string(),
      }),
    )
    .query(({ input: { code, areaSetCode } }) => {
      return findAreaByCodeWithGeometry(code, areaSetCode);
    }),
  stats: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: z.nativeEnum(AreaSetCode),
        calculationType: z.nativeEnum(CalculationType),
        column: z.string(),
        excludeColumns: z.array(z.string()),
        boundingBox: boundingBoxSchema.nullish(),
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
