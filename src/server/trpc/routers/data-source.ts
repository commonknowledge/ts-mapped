import { TRPCError } from "@trpc/server";
import { EnrichmentSourceType } from "@/server/models/DataSource";
import {
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

  delete: dataSourceProcedure.mutation(async ({ ctx }) => {
    await deleteDataSource(ctx.dataSource.id);
    return true;
  }),
});
