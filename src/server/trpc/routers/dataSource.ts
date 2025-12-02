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
import { dataSourceViewSchema } from "@/server/models/MapView";
import {
  applyFilterAndSearch,
  findDataRecordsByDataSource,
} from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
  findDataSourcesByIds,
  getJobInfo,
  updateDataSource,
} from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getPubSub } from "@/server/services/pubsub";
import { enqueue } from "@/server/services/queue";
import {
  dataSourceOwnerProcedure,
  dataSourceReadProcedure,
  organisationProcedure,
  publicProcedure,
  router,
} from "../index";
import type { DataSourceEvent } from "@/server/events";
import type { DataSource, DataSourceUpdate } from "@/server/models/DataSource";

export const dataSourceRouter = router({
  listReadable: publicProcedure.query(async ({ ctx }) => {
    const dataSources = await db
      .selectFrom("dataSource")
      .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
      .leftJoin("organisation", "dataSource.organisationId", "organisation.id")
      .leftJoin(
        "organisationUser",
        "organisation.id",
        "organisationUser.organisationId",
      )
      .where((eb) => {
        const filter = [eb("public", "=", true)];
        if (ctx.user?.id) {
          filter.push(eb("organisationUser.userId", "=", ctx.user.id));
        }
        return eb.or(filter);
      })
      .selectAll("dataSource")
      .select(db.fn.count("dataRecord.id").as("recordCount"))
      .groupBy("dataSource.id")
      .execute();

    return addImportInfo(dataSources);
  }),
  byOrganisation: organisationProcedure.query(async ({ ctx }) => {
    const dataSources = await db
      .selectFrom("dataSource")
      .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
      .where("organisationId", "=", ctx.organisation.id)
      .selectAll("dataSource")
      .select(db.fn.count("dataRecord.id").as("recordCount"))
      .groupBy("dataSource.id")
      .execute();

    return addImportInfo(dataSources);
  }),
  byId: dataSourceOwnerProcedure.query(async ({ ctx }) => {
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

  byIdWithRecords: dataSourceReadProcedure
    .input(
      z
        .object({ page: z.number().optional(), all: z.boolean().optional() })
        .and(dataSourceViewSchema.partial()),
    )
    .query(async ({ ctx, input }) => {
      const dataSource = await db
        .selectFrom("dataSource")
        .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
        .where("dataSource.id", "=", ctx.dataSource.id)
        .selectAll("dataSource")
        .select(({ eb, fn }) => [
          fn.countAll().as("count"),
          fn
            .count(
              eb
                .case()
                .when(applyFilterAndSearch(eb, input.filter, input.search))
                .then(1)
                .else(null)
                .end(),
            )
            .as("matched"),
        ])
        .groupBy("dataSource.id")
        .executeTakeFirst();

      if (!dataSource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data source not found",
        });
      }

      const records = await findDataRecordsByDataSource(
        ctx.dataSource.id,
        input.filter,
        input.search,
        input.page || 0,
        input.sort || [],
        input.all || false,
      );

      return {
        ...dataSource,
        records,
        count: {
          total: Number(dataSource.count) || 0,
          matched: Number(dataSource.matched) || 0,
        },
      };
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

  updateConfig: dataSourceOwnerProcedure
    .input(dataSourceSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const adaptor = getDataSourceAdaptor(ctx.dataSource);

      const update = {
        columnRoles: input.columnRoles,
        enrichments: input.enrichments,
        geocodingConfig: input.geocodingConfig,
        dateFormat: input.dateFormat,
      } as DataSourceUpdate;

      // Keep track of whether webhooks need to be enabled/disabled
      const nextAutoStatus = {
        autoEnrich: input.autoEnrich,
        autoImport: input.autoImport,
        changed: false,
      };

      if (typeof input.autoEnrich === "boolean") {
        update.autoEnrich = input.autoEnrich;
        nextAutoStatus.changed = input.autoEnrich !== input.autoEnrich;
        nextAutoStatus.autoEnrich = input.autoEnrich;
      }

      if (typeof input.autoImport === "boolean") {
        update.autoImport = input.autoImport;
        nextAutoStatus.changed = input.autoImport !== input.autoImport;
        nextAutoStatus.autoImport = input.autoImport;
      }

      if (nextAutoStatus.changed) {
        const enable =
          nextAutoStatus.autoEnrich || nextAutoStatus.autoImport || false;
        await adaptor?.toggleWebhook(enable);
      }
      await updateDataSource(ctx.dataSource.id, update);

      logger.info(
        `Updated ${ctx.dataSource.config.type} data source config: ${ctx.dataSource.id}`,
      );

      await enqueue("importDataSource", ctx.dataSource.id, {
        dataSourceId: ctx.dataSource.id,
      });

      return true;
    }),

  enqueueEnrichJob: dataSourceOwnerProcedure.mutation(async ({ input }) => {
    await enqueue("enrichDataSource", input.dataSourceId, {
      dataSourceId: input.dataSourceId,
    });
    return true;
  }),

  enqueueImportJob: dataSourceOwnerProcedure.mutation(async ({ input }) => {
    await enqueue("importDataSource", input.dataSourceId, {
      dataSourceId: input.dataSourceId,
    });
    return true;
  }),

  delete: dataSourceOwnerProcedure.mutation(async ({ ctx }) => {
    await deleteDataSource(ctx.dataSource.id);
    return true;
  }),

  events: dataSourceOwnerProcedure.subscription(async function* ({
    ctx,
    signal,
  }) {
    let sub: AsyncIterableIterator<DataSourceEvent> | null = null;
    try {
      signal?.addEventListener("abort", () => {
        sub?.return?.();
      });

      sub = getPubSub().subscribe("dataSourceEvent");
      for await (const event of sub) {
        if (!event) {
          return;
        }
        if (event.dataSourceId === ctx.dataSource.id) {
          yield event;
        }
      }
    } finally {
      sub?.return?.();
    }
  }),
});

const addImportInfo = async (
  dataSources: (DataSource & { recordCount: unknown })[],
) => {
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
};
