import {
  ColumnDef,
  ColumnType,
  ColumnsConfigInput,
  DataSource,
} from "@/__generated__/types";
import { getDataSourceAdaptor } from "@/server/adaptors";
import {
  createDataSource as _createDataSource,
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { enqueue } from "@/server/services/queue";
import { GeocodingType } from "@/types";
import {
  DataSourceConfigSchema,
  DataSourceEnrichmentColumnsSchema,
  DataSourceGeocodingConfig,
  DataSourceGeocodingConfigSchema,
} from "@/zod";
import { serializeDataSource } from "./serializers";

interface MutationResponse {
  code: number;
}

interface CreateDataSourceResponse {
  code: number;
  result?: DataSource;
}

export const createDataSource = async (
  _: unknown,
  { name, rawConfig }: { name: string; rawConfig: object },
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

    const geocodingConfig: DataSourceGeocodingConfig = {
      type: GeocodingType.none,
    };
    const dataSource = await _createDataSource({
      name,
      config: JSON.stringify(config),
      columnsConfig: JSON.stringify({}),
      enrichmentColumns: JSON.stringify([]),
      geocodingConfig: JSON.stringify(geocodingConfig),
      columnDefs: JSON.stringify(columnDefs),
    });

    logger.info(`Created ${config.type} data source: ${dataSource.id}`);
    return { code: 200, result: serializeDataSource(dataSource) };
  } catch (error) {
    logger.error(`Could not create data source`, { error });
  }
  return { code: 500 };
};

export const enqueueEnrichDataSourceJob = async (
  _: unknown,
  { dataSourceId }: { dataSourceId: string },
): Promise<MutationResponse> => {
  await enqueue("enrichDataSource", { dataSourceId });
  return { code: 200 };
};

export const enqueueImportDataSourceJob = async (
  _: unknown,
  { dataSourceId }: { dataSourceId: string },
): Promise<MutationResponse> => {
  await enqueue("importDataSource", { dataSourceId });
  return { code: 200 };
};

export const updateDataSourceConfig = async (
  _: unknown,
  {
    id,
    columnsConfig,
    rawEnrichmentColumns,
    rawGeocodingConfig,
  }: {
    id: string;
    columnsConfig?: ColumnsConfigInput | null;
    rawEnrichmentColumns?: object | null;
    rawGeocodingConfig?: object | null;
  },
): Promise<MutationResponse> => {
  try {
    const dataSource = await findDataSourceById(id);
    if (!dataSource) {
      return { code: 404 };
    }

    const update: {
      columnsConfig?: string;
      enrichmentColumns?: string;
      geocodingConfig?: string;
    } = {};

    if (columnsConfig) {
      update.columnsConfig = JSON.stringify(columnsConfig);
    }

    if (rawEnrichmentColumns) {
      const enrichmentColumns =
        DataSourceEnrichmentColumnsSchema.parse(rawEnrichmentColumns);
      update.enrichmentColumns = JSON.stringify(enrichmentColumns);
    }

    if (rawGeocodingConfig) {
      const geocodingConfig =
        DataSourceGeocodingConfigSchema.parse(rawGeocodingConfig);
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
};
