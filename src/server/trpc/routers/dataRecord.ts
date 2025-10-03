import z from "zod";
import {
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_EXTERNAL_ID_KEY,
  MARKER_ID_KEY,
  MARKER_MATCHED_COLUMN,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import { recordFilterSchema, recordSortSchema } from "@/server/models/MapView";
import {
  countDataRecordsForDataSource,
  findDataRecordsByDataSource,
  streamDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import { dataSourceReadProcedure, router } from "../index";
import type { DataRecord } from "@/server/models/DataRecord";
import type { PointFeature } from "@/types";

export const dataRecordRouter = router({
  list: dataSourceReadProcedure
    .input(
      z.object({
        filter: recordFilterSchema.optional(),
        search: z.string().optional(),
        page: z.number().optional(),
        sort: z.array(recordSortSchema).optional(),
        all: z.boolean().optional(),
      }),
    )
    .query(
      async ({ input: { dataSourceId, filter, search, page, sort, all } }) => {
        const records = await findDataRecordsByDataSource(
          dataSourceId,
          filter,
          search,
          page || 0,
          sort || [],
          all,
        );
        const count = await countDataRecordsForDataSource(
          dataSourceId,
          filter,
          search,
        );
        return { records, count };
      },
    ),
  markers: dataSourceReadProcedure
    .input(
      z.object({
        filter: recordFilterSchema.optional(),
        search: z.string().optional(),
      }),
    )
    .query(async function* ({
      ctx: { dataSource },
      input: { dataSourceId, filter, search },
    }) {
      const stream = streamDataRecordsByDataSource(
        dataSourceId,
        filter,
        search,
      );

      let row = await stream.next();
      while (row.value) {
        const dr: DataRecord & { [MARKER_MATCHED_COLUMN]: boolean } = row.value;
        if (dr.geocodeResult?.centralPoint) {
          const centralPoint = dr.geocodeResult.centralPoint;
          const coordinates = [centralPoint.lng, centralPoint.lat] as [
            number,
            number,
          ];
          const nameColumns = dataSource?.columnRoles.nameColumns;
          const feature: PointFeature = {
            type: "Feature",
            properties: {
              ...dr.json,
              [MARKER_ID_KEY]: dr.id,
              [MARKER_DATA_SOURCE_ID_KEY]: dr.dataSourceId,
              [MARKER_EXTERNAL_ID_KEY]: dr.externalId,
              // If no name column is specified, show the ID as the marker name instead
              [MARKER_NAME_KEY]: nameColumns?.length
                ? nameColumns
                    .map((c) => dr.json[c])
                    .filter(Boolean)
                    .join(" ")
                : dr.externalId,
              [MARKER_MATCHED_KEY]: dr[MARKER_MATCHED_COLUMN],
            },
            geometry: {
              type: "Point",
              coordinates,
            },
          };
          yield feature;
        }
        row = await stream.next();
      }
    }),
});
