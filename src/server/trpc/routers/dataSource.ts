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
import { findOrganisationsByUserId } from "@/server/repositories/Organisation";
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
    const organisations = ctx.user
      ? await findOrganisationsByUserId(ctx.user.id)
      : [];
    const dataSources = await db
      .selectFrom("dataSource")
      .leftJoin("dataRecord", "dataRecord.dataSourceId", "dataSource.id")
      .leftJoin("organisation", "dataSource.organisationId", "organisation.id")
      .where((eb) => {
        const filter = [eb("public", "=", true)];
        const organisationIds = organisations.map((o) => o.id);
        if (organisationIds.length > 0) {
          filter.push(eb("organisation.id", "in", organisationIds));
        }
        return eb.or(filter);
      })
      .selectAll("dataSource")
      // .distinct() is not required here because each dataRecord will only appear once
      // as it only belongs to one dataSource, which only belongs to one organisation
      // Count specifically data_record.id here to make use of the covering index
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
      // .distinct() is not required here because each dataRecord will only appear once
      // as it only belongs to one dataSource, which only belongs to one organisation
      // Count specifically data_record.id here to make use of the covering index
      .select(db.fn.count("dataRecord.id").as("recordCount"))
      .groupBy("dataSource.id")
      .execute();

    return addImportInfo(dataSources);
  }),
  byId: dataSourceOwnerProcedure.query(async ({ ctx }) => {
    const recordCount = await db
      .selectFrom("dataRecord")
      .where("dataSourceId", "=", ctx.dataSource.id)
      .select(db.fn.countAll().as("count"))
      .executeTakeFirst();

    const dataSourceIds = ctx.dataSource.enrichments
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
      ...ctx.dataSource,
      config: {
        ...ctx.dataSource.config,
        __SERIALIZE_CREDENTIALS: true,
      },
      enrichmentInfo,
      importInfo,
      enrichmentDataSources,
      recordCount: Number(recordCount?.count) || 0,
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

  checkWebhookStatus: dataSourceOwnerProcedure.query(async ({ ctx }) => {
    try {
      const adaptor = getDataSourceAdaptor(ctx.dataSource);
      if (
        adaptor &&
        "hasWebhookErrors" in adaptor &&
        typeof adaptor.hasWebhookErrors === "function"
      ) {
        const hasErrors = await adaptor.hasWebhookErrors();
        return {
          hasWebhook: true,
          hasErrors,
          error: hasErrors
            ? "Automatic sync is unavailable due to webhook errors. This is likely caused by special characters in the sheet name. Manual imports will still work and will attempt to repair the webhook automatically."
            : null,
        };
      }
      return { hasWebhook: false, hasErrors: false, error: null };
    } catch (error) {
      logger.error("Failed to check webhook status", { error });
      return {
        hasWebhook: false,
        hasErrors: false,
        error: "Failed to check webhook status",
      };
    }
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
        name: input.name,
        columnRoles: input.columnRoles,
        enrichments: input.enrichments,
        geocodingConfig: input.geocodingConfig,
        dateFormat: input.dateFormat,
        public: input.public,
        naIsNull: input.naIsNull,
      } as DataSourceUpdate;

      logger.info(
        `Updating ${ctx.dataSource.config.type} data source config: ${ctx.dataSource.id}`,
      );

      // Keep track of whether webhooks need to be enabled/disabled
      let autoChanged = false;

      if (typeof input.autoEnrich === "boolean") {
        update.autoEnrich = input.autoEnrich;
        autoChanged = input.autoEnrich !== ctx.dataSource.autoEnrich;
      }

      if (typeof input.autoImport === "boolean") {
        update.autoImport = input.autoImport;
        autoChanged =
          autoChanged || input.autoImport !== ctx.dataSource.autoImport;
      }

      if (autoChanged) {
        const enable = update.autoEnrich || update.autoImport || false;

        // Check for webhook errors before enabling
        if (enable && adaptor && "hasWebhookErrors" in adaptor) {
          try {
            const hasErrors = await adaptor.hasWebhookErrors();
            if (hasErrors) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Cannot enable automatic sync: webhook formulas contain errors. Please use manual import first - it will attempt to repair the webhook automatically.",
              });
            }
          } catch (error) {
            // If hasWebhookErrors throws, it's likely a permission issue
            if (error instanceof TRPCError) {
              throw error;
            }
            logger.error("Failed to check webhook status before enabling", {
              error,
            });
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Failed to verify webhook status. Please ensure the integration has proper permissions.",
            });
          }
        }

        logger.info(
          `Updating ${ctx.dataSource.config.type} webhook: ${ctx.dataSource.id}, enabled: ${enable}`,
        );
        await adaptor?.toggleWebhook(enable);
      }
      await updateDataSource(ctx.dataSource.id, update);

      logger.info(
        `Updated ${ctx.dataSource.config.type} data source config: ${ctx.dataSource.id}`,
      );

      // Only trigger import if config fields changed (not just name)
      const configFieldsChanged =
        input.columnRoles !== undefined ||
        input.enrichments !== undefined ||
        input.geocodingConfig !== undefined ||
        input.dateFormat !== undefined;

      if (configFieldsChanged) {
        await enqueue("importDataSource", ctx.dataSource.id, {
          dataSourceId: ctx.dataSource.id,
        });
      }

      return true;
    }),

  enqueueEnrichJob: dataSourceOwnerProcedure.mutation(async ({ input }) => {
    await enqueue("enrichDataSource", input.dataSourceId, {
      dataSourceId: input.dataSourceId,
    });
    return true;
  }),

  enqueueImportJob: dataSourceOwnerProcedure.mutation(
    async ({ ctx, input }) => {
      // Auto-repair webhook if needed (for Google Sheets with formula errors)
      // Note: Webhook errors should not prevent manual imports - webhooks are only
      // needed for automatic syncing. We attempt to repair but always proceed with import.
      try {
        const adaptor = getDataSourceAdaptor(ctx.dataSource);
        if (
          adaptor &&
          "hasWebhookErrors" in adaptor &&
          "repairWebhook" in adaptor
        ) {
          const hasErrors = await adaptor.hasWebhookErrors();
          if (hasErrors) {
            logger.info(
              `Attempting to repair webhook for data source ${ctx.dataSource.id}`,
            );
            await adaptor.repairWebhook();

            // Verify the repair was successful
            const stillHasErrors = await adaptor.hasWebhookErrors();
            if (stillHasErrors) {
              logger.warn(
                `Webhook repair failed for data source ${ctx.dataSource.id}, but proceeding with import`,
              );
            } else {
              logger.info(
                `Webhook successfully repaired for data source ${ctx.dataSource.id}`,
              );
            }
          }
        }
      } catch (error) {
        // Don't fail the import if webhook repair fails - log and continue
        logger.error(
          "Failed to check/repair webhook before import, proceeding with import anyway",
          { error },
        );
      }

      await enqueue("importDataSource", input.dataSourceId, {
        dataSourceId: input.dataSourceId,
      });
      return true;
    },
  ),

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
