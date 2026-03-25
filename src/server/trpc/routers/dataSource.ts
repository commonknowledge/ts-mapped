import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { ENRICHMENT_COLUMN_PREFIX, GE_DATA_SOURCE_NAME } from "@/constants";
import {
  ColumnType,
  DataSourceType,
  EnrichmentSourceType,
  GeocodingType,
  columnMetadataSchema,
  dataSourceSchema,
} from "@/models/DataSource";
import { defaultInspectorBoundaryConfigSchema } from "@/models/MapView";
import { dataSourceViewSchema } from "@/models/MapView";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  getEnrichedColumn,
  removeEnrichmentColumnsFromDataSource,
} from "@/server/mapping/enrich";
import {
  findColumnMetadataOverridesByOrg,
  upsertColumnMetadataOverride,
} from "@/server/repositories/ColumnMetadataOverride";
import {
  applyFilterAndSearch,
  findDataRecordsByDataSource,
  findDataRecordsByIds,
} from "@/server/repositories/DataRecord";
import {
  createDataSource,
  deleteDataSource,
  findDataSourcesByIds,
  findPublicDataSources,
  getJobInfo,
  getUniqueColumnValues,
  updateDataSource,
  updateDataSourceDefaultInspectorConfig,
} from "@/server/repositories/DataSource";
import { findMapViewById } from "@/server/repositories/MapView";
import { findOrganisationsByUserId } from "@/server/repositories/Organisation";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { getPubSub } from "@/server/services/pubsub";
import { enqueue } from "@/server/services/queue";
import { canReadDataSource } from "@/server/utils/auth";
import { getVisualisedDataSourceIds } from "@/utils/map";
import {
  dataSourceOwnerProcedure,
  dataSourceReadProcedure,
  mapReadProcedure,
  organisationProcedure,
  protectedProcedure,
  router,
  superadminProcedure,
} from "../index";
import type { DataSource } from "@/models/DataSource";
import type { DataSourceEvent } from "@/server/events";
import type { DataSourceUpdate } from "@/server/models/DataSource";

export const dataSourceRouter = router({
  listForMapView: mapReadProcedure
    .input(z.object({ viewId: z.string() }))
    .query(async ({ ctx: { map }, input }) => {
      const view = await findMapViewById(input.viewId);
      if (!view || view.mapId !== map.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "View not found" });
      }

      const ids = getVisualisedDataSourceIds(map.config, view);
      if (!ids.length) return [];
      const dataSources = await findDataSourcesByIds(ids);
      const withImportInfo = await addImportInfo(dataSources);
      return withImportInfo.map((ds) => ({
        ...ds,
        columnMetadataOverride: null,
      }));
    }),
  listReadable: protectedProcedure
    .input(z.object({ activeOrganisationId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const organisations = ctx.user
        ? await findOrganisationsByUserId(ctx.user.id)
        : [];
      if (
        input?.activeOrganisationId &&
        !organisations.find((o) => o.id === input?.activeOrganisationId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid organisation ID.",
        });
      }
      const dataSources = await db
        .selectFrom("dataSource")
        .leftJoin(
          "organisation",
          "dataSource.organisationId",
          "organisation.id",
        )
        .where((eb) => {
          const filter = [eb("public", "=", true)];
          const organisationIds = organisations.map((o) => o.id);
          if (organisationIds.length > 0) {
            filter.push(eb("organisation.id", "in", organisationIds));
          }
          return eb.or(filter);
        })
        .selectAll("dataSource")
        .execute();

      const orgId = input?.activeOrganisationId;
      const activeOrg = organisations.find((o) => o.id === orgId);
      const isABCT = activeOrg?.name.includes("AB Charitable Trust") ?? false;
      const filteredDataSources = isABCT
        ? dataSources.filter(
            (ds) =>
              ds.organisationId === orgId || ds.name === GE_DATA_SOURCE_NAME,
          )
        : dataSources;

      const overrides =
        orgId && filteredDataSources.length
          ? await findColumnMetadataOverridesByOrg(
              orgId,
              filteredDataSources.map((ds) => ds.id),
            )
          : [];

      const overrideMap = new Map(
        overrides.map((o) => [o.dataSourceId, o.columnMetadata]),
      );

      const withImportInfo = await addImportInfo(filteredDataSources);
      return withImportInfo.map((ds) => ({
        ...ds,
        columnMetadataOverride: overrideMap.get(ds.id) ?? null,
      }));
    }),
  byOrganisation: organisationProcedure.query(async ({ ctx }) => {
    const dataSources = await db
      .selectFrom("dataSource")
      .where("organisationId", "=", ctx.organisation.id)
      .selectAll("dataSource")
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

  enrichmentPreview: dataSourceOwnerProcedure
    .input(z.object({ dataRecordIds: z.array(z.string()).min(1).max(50) }))
    .query(async ({ ctx, input }) => {
      const { dataSource } = ctx;

      // Validate that the user can read all data sources referenced by enrichments
      const referencedDataSourceIds = dataSource.enrichments
        .filter((e) => e.sourceType === EnrichmentSourceType.DataSource)
        .map((e) => e.dataSourceId);

      if (referencedDataSourceIds.length > 0) {
        const referencedDataSources = await findDataSourcesByIds(
          referencedDataSourceIds,
        );
        for (const ds of referencedDataSources) {
          const hasAccess = await canReadDataSource(ds, ctx.user.id);
          if (!hasAccess) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `You do not have access to a referenced data source`,
            });
          }
        }
      }
      const existingColumnNames = new Set(
        (dataSource.columnDefs ?? []).map((col) => col.name),
      );
      const newEnrichments = dataSource.enrichments.filter(
        (e) => !existingColumnNames.has(e.name),
      );
      if (newEnrichments.length === 0) {
        return {};
      }

      const records = await findDataRecordsByIds(
        input.dataRecordIds,
        dataSource.id,
      );

      const result: Record<string, Record<string, unknown>> = {};
      for (const record of records) {
        if (!record.geocodeResult) {
          result[record.id] = {};
          continue;
        }
        const enrichedValues: Record<string, unknown> = {};
        for (const enrichment of newEnrichments) {
          const colName = enrichment.name;
          const col = await getEnrichedColumn(
            { externalId: record.externalId, json: record.json },
            record.geocodeResult,
            enrichment,
          );
          enrichedValues[colName] = col?.value ?? null;
        }
        result[record.id] = enrichedValues;
      }
      return result;
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

  uniqueColumnValues: dataSourceReadProcedure
    .input(z.object({ column: z.string() }))
    .query(async ({ ctx, input }) => {
      return getUniqueColumnValues(ctx.dataSource.id, input.column);
    }),

  checkWebhookStatus: dataSourceOwnerProcedure.query(async ({ ctx }) => {
    if (!ctx.dataSource.autoEnrich && !ctx.dataSource.autoImport) {
      return { hasWebhook: false, hasErrors: false, error: null };
    }
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
        columnMetadata: [],
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
      // Validate that the user can read all data sources referenced by enrichments
      if (input.enrichments) {
        const referencedDataSourceIds = input.enrichments
          .filter((e) => e.sourceType === EnrichmentSourceType.DataSource)
          .map((e) => e.dataSourceId);

        if (referencedDataSourceIds.length > 0) {
          const referencedDataSources = await findDataSourcesByIds(
            referencedDataSourceIds,
          );
          for (const ds of referencedDataSources) {
            const hasAccess = await canReadDataSource(ds, ctx.user.id);
            if (!hasAccess) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `You do not have access to a referenced data source`,
              });
            }
          }
        }
      }

      const adaptor = getDataSourceAdaptor(ctx.dataSource);

      const update = {
        name: input.name,
        columnRoles: input.columnRoles,
        columnMetadata: input.columnMetadata,
        enrichments: input.enrichments,
        geocodingConfig: input.geocodingConfig,
        dateFormat: input.dateFormat,
        public: input.public,
        naIsNull: input.naIsNull,
        nullIsZero: input.nullIsZero,
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

      // If enrichments were removed, synchronously remove their columns and enqueue background cleanup job
      if (input.enrichments !== undefined) {
        const oldNames = new Set(
          (ctx.dataSource.enrichments ?? []).map((e) => e.name),
        );
        const newNames = new Set(input.enrichments.map((e) => e.name));
        const removedNames = [...oldNames].filter(
          (name) => !newNames.has(name),
        );
        if (removedNames.length > 0) {
          // Synchronously remove columnDefs (enrichments already updated above)
          await removeEnrichmentColumnsFromDataSource(
            ctx.dataSource.id,
            removedNames,
          );
          await enqueue("removeEnrichmentColumns", ctx.dataSource.id, {
            dataSourceId: ctx.dataSource.id,
            columnNames: removedNames,
          });
        }
      }

      // Only trigger import if config fields changed (not just name)
      const configFieldsChanged =
        input.columnRoles !== undefined ||
        input.geocodingConfig !== undefined ||
        input.dateFormat !== undefined;

      if (configFieldsChanged) {
        await enqueue("importDataSource", ctx.dataSource.id, {
          dataSourceId: ctx.dataSource.id,
        });
      }

      return true;
    }),

  deleteEnrichmentColumns: dataSourceOwnerProcedure
    .input(z.object({ columnNames: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      for (const columnName of input.columnNames) {
        if (!columnName.startsWith(ENRICHMENT_COLUMN_PREFIX)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Column "${columnName}" is not an enrichment column`,
          });
        }
      }

      // Synchronously remove enrichment metadata (enrichments + columnDefs)
      await removeEnrichmentColumnsFromDataSource(
        ctx.dataSource.id,
        input.columnNames,
      );

      // Enqueue background job for expensive cleanup (external source + record JSON)
      // CSV data sources don't need background cleanup — just removing the config is enough
      if (
        input.columnNames.length > 0 &&
        ctx.dataSource.config.type !== DataSourceType.CSV
      ) {
        await enqueue("removeEnrichmentColumns", ctx.dataSource.id, {
          dataSourceId: ctx.dataSource.id,
          columnNames: input.columnNames,
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
        const shouldHaveWebhook =
          ctx.dataSource.autoEnrich || ctx.dataSource.autoImport;
        if (
          shouldHaveWebhook &&
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

  updateColumnMetadataOverride: organisationProcedure
    .input(
      z.object({
        dataSourceId: z.string(),
        columnMetadata: z.array(columnMetadataSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await upsertColumnMetadataOverride(
        ctx.organisation.id,
        input.dataSourceId,
        input.columnMetadata,
      );
      return true;
    }),

  listPublic: superadminProcedure.query(async () => {
    const dataSources = await findPublicDataSources();
    return addImportInfo(dataSources);
  }),

  updateDefaultInspectorConfig: superadminProcedure
    .input(
      z.object({
        dataSourceId: z.string(),
        config: defaultInspectorBoundaryConfigSchema.nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      await updateDataSourceDefaultInspectorConfig(
        input.dataSourceId,
        input.config,
      );
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

const addImportInfo = async (dataSources: DataSource[]) => {
  // Get import info for all data sources
  const importInfos = await Promise.all(
    dataSources.map((dataSource) =>
      getJobInfo(dataSource.id, "importDataSource"),
    ),
  );

  return dataSources.map((dataSource, index) => ({
    ...dataSource,
    importInfo: importInfos[index],
  }));
};
