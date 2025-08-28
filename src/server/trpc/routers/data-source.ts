import { db } from "@/server/services/database";
import { organisationProcedure, protectedProcedure, router } from "../index";

export const dataSourceRouter = router({
  all: protectedProcedure.query(async ({ ctx }) => {
    const dataSources = await db
      .selectFrom("dataSource")
      .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
      .innerJoin("organisation", "dataSource.organisationId", "organisation.id")
      .innerJoin(
        "organisationUser",
        "organisation.id",
        "organisationUser.organisationId",
      )
      .where((eb) =>
        eb.or([
          eb("organisationUser.userId", "=", ctx.user.id),
          eb("public", "=", true),
        ]),
      )
      .selectAll("dataSource")
      .select(db.fn.count("dataRecord.id").as("recordCount"))
      .groupBy("dataSource.id")
      .execute();

    return dataSources.map((ds) => ({
      ...ds,
      recordCount: { count: Number(ds.recordCount) || 0 },
    }));
  }),
  byOrganisation: organisationProcedure.query(async ({ input }) => {
    const dataSources = await db
      .selectFrom("dataSource")
      .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
      .where("organisationId", "=", input.organisationId)
      .selectAll("dataSource")
      .select(db.fn.count("dataRecord.id").as("recordCount"))
      .groupBy("dataSource.id")
      .execute();

    return dataSources.map((ds) => ({
      ...ds,
      recordCount: { count: Number(ds.recordCount) || 0 },
    }));
  }),
});
