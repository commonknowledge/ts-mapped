import {
  ColumnDef,
  ColumnType,
  CreateDataSourceResponse,
  GeocodingType,
  MutationResolvers as MutationResolversType,
  MutationResponse,
  MutationUpdateDataSourceConfigArgs,
  MutationUpsertMapViewArgs,
} from "@/__generated__/types";
import { serializeDataSource } from "@/app/api/graphql/serializers";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  createDataSource,
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import { insertMapView, updateMapView } from "@/server/repositories/MapView";
import logger from "@/server/services/logger";
import { enqueue } from "@/server/services/queue";
import {
  DataSourceConfigSchema,
  EnrichmentSchema,
  GeocodingConfig,
  GeocodingConfigSchema,
} from "@/zod";

const MutationResolvers: MutationResolversType = {
  createDataSource: async (
    _: unknown,
    {
      name,
      organisationId,
      rawConfig,
    }: { name: string; organisationId: string; rawConfig: unknown },
  ): Promise<CreateDataSourceResponse> => {
    try {
      const config = DataSourceConfigSchema.parse(rawConfig);
      const adaptor = getDataSourceAdaptor(config);
      const firstRecord = adaptor ? await adaptor.fetchFirst() : null;
      if (!firstRecord) {
        return { code: 500 };
      }

      const columnDefs: ColumnDef[] = Object.keys(firstRecord.json).map(
        (key) => ({
          name: key,
          type: ColumnType.Unknown,
        }),
      );

      const geocodingConfig: GeocodingConfig = {
        type: GeocodingType.None,
      };
      const dataSource = await createDataSource({
        name,
        organisationId,
        autoEnrich: false,
        autoImport: false,
        config: JSON.stringify(config),
        columnRoles: JSON.stringify({}),
        enrichments: JSON.stringify([]),
        geocodingConfig: JSON.stringify(geocodingConfig),
        columnDefs: JSON.stringify(columnDefs),
      });

      logger.info(`Created ${config.type} data source: ${dataSource.id}`);
      return { code: 200, result: serializeDataSource(dataSource) };
    } catch (error) {
      logger.error(`Could not create data source`, { error });
    }
    return { code: 500 };
  },
  enqueueEnrichDataSourceJob: async (
    _: unknown,
    { dataSourceId }: { dataSourceId: string },
  ): Promise<MutationResponse> => {
    await enqueue("enrichDataSource", { dataSourceId });
    return { code: 200 };
  },
  enqueueImportDataSourceJob: async (
    _: unknown,
    { dataSourceId }: { dataSourceId: string },
  ): Promise<MutationResponse> => {
    await enqueue("importDataSource", { dataSourceId });
    return { code: 200 };
  },
  updateDataSourceConfig: async (
    _: unknown,
    {
      id,
      columnRoles,
      looseEnrichments,
      looseGeocodingConfig,
      autoEnrich,
      autoImport,
    }: MutationUpdateDataSourceConfigArgs,
  ): Promise<MutationResponse> => {
    try {
      const dataSource = await findDataSourceById(id);
      if (!dataSource) {
        return { code: 404 };
      }

      const adaptor = getDataSourceAdaptor(dataSource.config);

      const update: {
        columnRoles?: string;
        enrichments?: string;
        geocodingConfig?: string;
        autoEnrich?: boolean;
        autoImport?: boolean;
      } = {};

      // Keep track of whether webhooks need to be enabled/disabled
      const nextAutoStatus = {
        autoEnrich: dataSource.autoEnrich,
        autoImport: dataSource.autoImport,
        changed: false,
      };

      if (typeof autoEnrich === "boolean") {
        update.autoEnrich = autoEnrich;
        nextAutoStatus.changed = dataSource.autoEnrich !== autoEnrich;
        nextAutoStatus.autoEnrich = autoEnrich;
      }

      if (typeof autoImport === "boolean") {
        update.autoImport = autoImport;
        nextAutoStatus.changed = dataSource.autoImport !== autoImport;
        nextAutoStatus.autoImport = autoImport;
      }

      if (nextAutoStatus.changed) {
        const enable = nextAutoStatus.autoEnrich || nextAutoStatus.autoImport;
        await adaptor?.toggleWebhook(dataSource.id, enable);
      }

      if (columnRoles) {
        update.columnRoles = JSON.stringify(columnRoles);
      }

      if (looseEnrichments) {
        const enrichments = [];
        for (const enrichment of looseEnrichments) {
          enrichments.push(EnrichmentSchema.parse(enrichment));
        }
        update.enrichments = JSON.stringify(enrichments);
      }

      if (looseGeocodingConfig) {
        const geocodingConfig =
          GeocodingConfigSchema.parse(looseGeocodingConfig);
        update.geocodingConfig = JSON.stringify(geocodingConfig);
      }

      await updateDataSource(id, update);
      logger.info(
        `Updated ${dataSource.config.type} data source config: ${dataSource.id}`,
      );
      return { code: 200 };
    } catch (error) {
      logger.error(`Could not update data source`, { error });
    }
    return { code: 500 };
  },
  upsertMapView: async (_: unknown, args: MutationUpsertMapViewArgs) => {
    try {
      const { id, config } = args;
      let updatedMapView = null;
      if (id) {
        updatedMapView = await updateMapView(id, {
          config: JSON.stringify(config),
        });
      } else {
        updatedMapView = await insertMapView({
          config: JSON.stringify(config),
          mapId: args.mapId,
        });
      }
      return { code: 200, result: updatedMapView.id };
    } catch (error) {
      logger.error(`Could not upsert map view: ${JSON.stringify(args)}`, {
        error,
      });
    }
    return { code: 500 };
  },
};

export default MutationResolvers;
