import z from "zod";
import { areaSetCode } from "@/server/models/AreaSet";
import { calculationType } from "@/server/models/MapView";
import { getAreaStats } from "@/server/stats";
import { dataSourceReadProcedure, router } from "../index";

export const areaStatsRouter = router({
  list: dataSourceReadProcedure
    .input(
      z.object({
        areaSetCode: areaSetCode,
        dataSourceId: z.string(),
        calculationType: calculationType,
        column: z.string(),
        excludeColumns: z.array(z.string()),
        boundingBox: z
          .object({
            east: z.number(),
            south: z.number(),
            west: z.number(),
            north: z.number(),
          })
          .nullish(),
      }),
    )
    .query(
      async ({
        input: {
          areaSetCode,
          dataSourceId,
          calculationType,
          column,
          excludeColumns,
          boundingBox,
        },
      }) => {
        return getAreaStats(
          areaSetCode,
          dataSourceId,
          calculationType,
          column,
          excludeColumns,
          boundingBox,
        );
      },
    ),
});
