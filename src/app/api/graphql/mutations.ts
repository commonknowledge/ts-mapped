import { ColumnType, DataSource } from "@/__generated__/types";
import { getDataSourceAdaptor } from "@/server/adaptors";
import { ColumnDefs } from "@/server/models/DataSource";
import {
  createDataSource as _createDataSource,
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { enqueue } from "@/server/services/queue";
import { getErrorMessage } from "@/server/utils";
import { GeocodingType } from "@/types";
import {
  DataSourceConfigSchema,
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

    const columnDefs: ColumnDefs = Object.keys(firstRecord.json).map((key) => ({
      name: key,
      type: ColumnType.Unknown,
    }));

    const geocodingConfig: DataSourceGeocodingConfig = {
      type: GeocodingType.none,
    };
    const dataSource = await _createDataSource({
      name,
      config: JSON.stringify(config),
      geocodingConfig: JSON.stringify(geocodingConfig),
      columnDefs: JSON.stringify(columnDefs),
    });

    logger.info(`Created ${config.type} data source: ${dataSource.id}`);
    return { code: 200, result: serializeDataSource(dataSource) };
  } catch (e) {
    const error = getErrorMessage(e);
    logger.error(`Could not create data source: ${error}`);
  }
  return { code: 500 };
};

export const enqueueImportDataSourceJob = async (
  _: unknown,
  { dataSourceId }: { dataSourceId: string },
): Promise<MutationResponse> => {
  await enqueue("importDataSource", { dataSourceId });
  return { code: 200 };
};

export const updateGeocodingConfig = async (
  _: unknown,
  { id, rawGeocodingConfig }: { id: string; rawGeocodingConfig: object },
): Promise<MutationResponse> => {
  try {
    const dataSource = await findDataSourceById(id);
    if (!dataSource) {
      return { code: 404 };
    }
    const geocodingConfig =
      DataSourceGeocodingConfigSchema.parse(rawGeocodingConfig);
    await updateDataSource(id, {
      geocodingConfig: JSON.stringify(geocodingConfig),
    });
    logger.info(
      `Updated ${dataSource.config.type} data source geocoding config: ${dataSource.id}`,
    );
    return { code: 200 };
  } catch (e) {
    const error = getErrorMessage(e);
    logger.error(`Could not update data source: ${error}`);
  }
  return { code: 500 };
};
