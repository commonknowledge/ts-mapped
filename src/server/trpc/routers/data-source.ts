import { TRPCError } from "@trpc/server";
import {
  EnrichmentSourceType,
  dataSourceSchema,
} from "@/server/models/DataSource";
import {
  createDataSource,
  deleteDataSource,
  findDataSourcesByIds,
  getJobInfo,
} from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
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

    return dataSources.map((dataSource) => ({
      ...dataSource,
      recordCount: Number(dataSource.recordCount) || 0,
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
          ds.map((ds) => ({ name: ds.name, id: ds.id }))
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

  create: organisationProcedure
    .input(
      dataSourceSchema.pick({
        name: true,
        recordType: true,
        config: true,
        geocodingConfig: true,
      })
    )
    .mutation(async ({ input }) => {
      return createDataSource({
        ...input,
        autoEnrich: false,
        autoImport: false,
        public: false,
        columnDefs: [],
        columnRoles: { nameColumns: [] },
        enrichments: [],
      });
    }),

  delete: dataSourceProcedure.mutation(async ({ ctx }) => {
    await deleteDataSource(ctx.dataSource.id);
    return true;
  }),
});
