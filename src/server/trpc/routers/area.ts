import z from "zod";
import { boundingBoxSchema } from "@/server/models/Area";
import { AreaSetCode } from "@/server/models/AreaSet";
import { CalculationType } from "@/server/models/MapView";
import {
  findAreaByCodeWithGeometry,
  searchAreas,
} from "@/server/repositories/Area";
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
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
      }),
    )
    .query(({ input: { query } }) => {
      return searchAreas(query);
    }),
  stats: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: z.nativeEnum(AreaSetCode),
        calculationType: z.nativeEnum(CalculationType),
        column: z.string(),
        secondaryColumn: z.string().optional(),
        nullIsZero: z.boolean().optional(),
        includeColumns: z.array(z.string()).optional().nullable(),
        boundingBox: boundingBoxSchema.nullish(),
      }),
    )
    .query(({ input }) => {
      return getAreaStats(input);
    }),
});
