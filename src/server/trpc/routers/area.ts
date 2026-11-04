import { TRPCError } from "@trpc/server";
import z from "zod";
import { AREA_RANKING_EXCLUDED_SETS } from "@/constants";
import { boundingBoxSchema } from "@/models/Area";
import { AreaSetCode } from "@/models/AreaSet";
import { AREA_LIST_MAX_AREAS } from "@/models/Map";
import { CalculationType } from "@/models/shared";
import {
  findAreaByCode,
  findAreaByCodeWithGeometry,
  findAreaNamesByCodes,
  searchAreas,
} from "@/server/repositories/Area";
import { findDataRecordsInAreas } from "@/server/repositories/DataRecord";
import { getAreaStats } from "@/server/stats";
import { dataSourceReadProcedure, router, viewerProcedure } from "../index";

export const areaRouter = router({
  byCode: viewerProcedure
    .input(
      z.object({
        areaSetCode: z.enum(AreaSetCode),
        code: z.string(),
      }),
    )
    .query(async ({ input: { code, areaSetCode } }) => {
      const area = await findAreaByCodeWithGeometry(code, areaSetCode);
      return area ?? null;
    }),
  /** Name lookup without the geometry payload of `byCode` */
  nameByCode: viewerProcedure
    .input(
      z.object({
        areaSetCode: z.enum(AreaSetCode),
        code: z.string(),
      }),
    )
    .query(async ({ input: { code, areaSetCode } }) => {
      const area = await findAreaByCode(code, areaSetCode);
      return area ? { code: area.code, name: area.name } : null;
    }),
  /** Names for many codes in one boundary set, e.g. to make a list of
   *  areas picked on the map */
  namesByCodes: viewerProcedure
    .input(
      z.object({
        areaSetCode: z.enum(AreaSetCode),
        codes: z.array(z.string()).max(AREA_LIST_MAX_AREAS),
      }),
    )
    .query(({ input }) => findAreaNamesByCodes(input)),
  search: viewerProcedure
    .input(
      z.object({
        search: z.string().min(1).max(200),
      }),
    )
    .query(({ input: { search } }) => {
      return searchAreas(search);
    }),
  /** One column's value in every area of a set, with area names, for
   *  comparing areas against each other. Unsorted: the client sorts. */
  ranking: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: z.enum(AreaSetCode),
        calculationType: z.enum(CalculationType),
        column: z.string(),
      }),
    )
    .query(async ({ input }) => {
      if (AREA_RANKING_EXCLUDED_SETS.includes(input.areaSetCode)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Too many areas to compare",
        });
      }
      const areaStats = await getAreaStats(input);
      const stats = areaStats.primary?.stats ?? [];
      const names = await findAreaNamesByCodes({
        codes: stats.map((stat) => stat.areaCode),
        areaSetCode: input.areaSetCode,
      });
      const nameByCode = new Map(names.map((area) => [area.code, area.name]));
      return {
        columnType: areaStats.primary?.columnType ?? null,
        rows: stats.map((stat) => ({
          code: stat.areaCode,
          name: nameByCode.get(stat.areaCode) ?? stat.areaCode,
          value: stat.value,
        })),
      };
    }),
  /** A data source's records in some areas, e.g. the members in a list */
  recordsInAreas: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: z.enum(AreaSetCode),
        areaCodes: z.array(z.string()).max(AREA_LIST_MAX_AREAS),
        limit: z.number().int().min(1).max(1000).default(500),
      }),
    )
    .query(({ input }) =>
      findDataRecordsInAreas({
        dataSourceId: input.dataSourceId,
        areaSetCode: input.areaSetCode,
        areaCodes: input.areaCodes,
        limit: input.limit,
      }),
    ),
  stats: dataSourceReadProcedure
    .input(
      z.object({
        // areaSetCode needs to be nullable so that an empty response can be returned
        // when the user has no area selected
        areaSetCode: z.enum(AreaSetCode).nullable(),
        calculationType: z.enum(CalculationType),
        column: z.string(),
        secondaryColumn: z.string().optional(),
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
