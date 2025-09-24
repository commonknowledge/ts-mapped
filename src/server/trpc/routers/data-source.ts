import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  ColumnType,
  EnrichmentSourceType,
  GeocodingType,
  dataSourceSchema,
} from "@/server/models/DataSource";
import { findDataRecordsByDataSource } from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
  findDataSourcesByIds,
  getJobInfo,
} from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { dataSourceProcedure, organisationProcedure, router } from "../index";

export const dataSourceRouter = router({
  byOrganisation: organisationProcedure.query(async ({ ctx }) => {
    const dataSources = await db
      .selectFrom("dataSource")
      .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
      .where("organisationId", "=", ctx.organisation.id)
      .selectAll("dataSource")
      .select(db.fn.count("dataRecord.id").as("recordCount"))
      .groupBy("dataSource.id")
      .execute();

    // Get import info for all data sources
    const importInfos = await Promise.all(
      dataSources.map((dataSource) =>
        getJobInfo(dataSource.id, "importDataSource"),
      ),
    );

    return dataSources.map((dataSource, index) => ({
      ...dataSource,
      recordCount: Number(dataSource.recordCount) || 0,
      importInfo: importInfos[index],
    }));
  }),
  byId: dataSourceProcedure.query(async ({ ctx }) => {
    const dataSource = await db
      .selectFrom("dataSource")
      .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
      .where("organisationId", "=", ctx.organisation.id)
      .where("dataSource.id", "=", ctx.dataSource.id)
      .selectAll("dataSource")
      .select(db.fn.count("dataRecord.id").as("recordCount"))
      .groupBy("dataSource.id")
      .executeTakeFirst();

    if (!dataSource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Data source not found",
      });
    }

    const dataSourceIds = dataSource.enrichments
      .filter((e) => e.sourceType === EnrichmentSourceType.DataSource)
      .map((e) => e.dataSourceId)
      .filter((id) => typeof id === "string");

    const [enrichmentInfo, importInfo, enrichmentDataSources] =
      await Promise.all([
        getJobInfo(ctx.dataSource.id, "enrichDataSource"),
        getJobInfo(ctx.dataSource.id, "importDataSource"),
        findDataSourcesByIds(dataSourceIds).then((ds) =>
          ds.map((ds) => ({ name: ds.name, id: ds.id })),
        ),
      ]);
    return {
      ...dataSource,
      config: {
        ...dataSource.config,
        __SERIALIZE_CREDENTIALS: true,
      },
      enrichmentInfo,
      importInfo,
      enrichmentDataSources,
      recordCount: Number(dataSource.recordCount) || 0,
    };
  }),

  byIdWithRecords: dataSourceProcedure
    .input(z.object({ search: z.string().trim().optional() }))
    .query(async ({ ctx, input }) => {
      const dataSource = await db
        .selectFrom("dataSource")
        .where("id", "=", ctx.dataSource.id)
        .selectAll()
        .executeTakeFirst();

      if (!dataSource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data source not found",
        });
      }

      const records = await findDataRecordsByDataSource(
        ctx.dataSource.id,
        null,
        input.search,
        0,
        [],
        true,
      );

      return { ...dataSource, records };
    }),

  create: organisationProcedure
    .input(
      dataSourceSchema.pick({ name: true, recordType: true, config: true }),
    )
    .mutation(async ({ input }) => {
      const id = uuidv4();
      const adaptor = getDataSourceAdaptor({ id, config: input.config });

      const firstRecord = adaptor ? await adaptor.fetchFirst() : null;
      if (!firstRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not fetch records, please check your config",
        });
      }

      const columnDefs = Object.keys(firstRecord.json).map((key) => ({
        name: key,
        type: ColumnType.Unknown,
      }));

      const dataSource = await createDataSource({
        ...input,
        autoEnrich: false,
        autoImport: false,
        public: false,
        columnDefs,
        columnRoles: { nameColumns: [] },
        geocodingConfig: { type: GeocodingType.None },
        enrichments: [],
      });

      logger.info(`Created ${input.config.type} data source: ${dataSource.id}`);

      return dataSource;
    }),

  delete: dataSourceProcedure.mutation(async ({ ctx }) => {
    await deleteDataSource(ctx.dataSource.id);
    return true;
  }),
});
