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
        search: z.string().min(1).max(200),
      }),
    )
    .query(({ input: { search } }) => {
      return searchAreas(search);
    }),
  stats: dataSourceReadProcedure
    .input(
      z.object({
        // areaSetCode needs to be nullable so that an empty response can be returned
        // when the user has no area selected
        areaSetCode: z.nativeEnum(AreaSetCode).nullable(),
        calculationType: z.nativeEnum(CalculationType),
        column: z.string(),
        secondaryColumn: z.string().optional(),
        nullIsZero: z.boolean().optional(),
        includeColumns: z.array(z.string()).optional().nullable(),
        boundingBox: boundingBoxSchema.nullish(),
      }),
    )
    .query(({ input }) => {
      const areaSetCode = input.areaSetCode;
      if (!areaSetCode) {
        return null;
      }
      return getAreaStats({ ...input, areaSetCode });
    }),
});
