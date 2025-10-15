import z from "zod";
import { boundingBoxSchema } from "@/server/models/Area";
import { AreaSetCode } from "@/server/models/AreaSet";
import { CalculationType } from "@/server/models/MapView";
import { findAllAreasByAreaSet } from "@/server/repositories/Area";
import { getAreaStats } from "@/server/stats";
import { dataSourceReadProcedure, publicProcedure, router } from "../index";

export const areaRouter = router({
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

  list: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: z.nativeEnum(AreaSetCode),
        searchTerm: z.string().optional(),
        page: z.number().min(0).default(0),
        pageSize: z.number().min(1).max(100).default(50),
        sortBy: z
          .enum(["name", "memberCount", "markerCount", "membersAndMarkers"])
          .default("membersAndMarkers"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ input }) => {
      return findAllAreasByAreaSet(input.areaSetCode, {
        searchTerm: input.searchTerm,
        page: input.page,
        pageSize: input.pageSize,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      });
    }),

  // Public endpoint for listing all areas without requiring a data source
  listAll: publicProcedure
    .input(
      z.object({
        areaSetCode: z.nativeEnum(AreaSetCode),
        searchTerm: z.string().optional(),
        page: z.number().min(0).default(0),
        pageSize: z.number().min(1).max(100).default(50),
        sortBy: z
          .enum(["name", "memberCount", "markerCount", "membersAndMarkers"])
          .default("membersAndMarkers"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        dataSourceId: z.string().optional(),
        mapId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return findAllAreasByAreaSet(input.areaSetCode, {
        searchTerm: input.searchTerm,
        page: input.page,
        pageSize: input.pageSize,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        dataSourceId: input.dataSourceId,
        mapId: input.mapId,
      });
    }),
});
