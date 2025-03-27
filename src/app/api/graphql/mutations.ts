import { DataSource } from "@/__generated__/types";
import {
  DataSourceConfigSchema,
  DataSourceGeocodingConfigSchema,
} from "@/server/models/DataSource";
import { createDataSource as _createDataSource } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { enqueue } from "@/server/services/queue";
import { getErrorMessage } from "@/server/util";
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
  {
    name,
    rawConfig,
    rawGeocodingConfig,
  }: { name: string; rawConfig: object; rawGeocodingConfig: object },
): Promise<CreateDataSourceResponse> => {
  try {
    const config = DataSourceConfigSchema.parse(rawConfig);
    const geocodingConfig =
      DataSourceGeocodingConfigSchema.parse(rawGeocodingConfig);
    const dataSource = await _createDataSource({
      name,
      config: JSON.stringify(config),
      geocodingConfig: JSON.stringify(geocodingConfig),
      columnDefs: "{}",
    });
    return { code: 200, result: serializeDataSource(dataSource) };
  } catch (e) {
    const error = getErrorMessage(e);
    logger.error(`Could not create data source: ${error}`);
  }
  return { code: 500 };
};

export const triggerImportDataSourceJob = async (
  _: unknown,
  { dataSourceId }: { dataSourceId: string },
): Promise<MutationResponse> => {
  await enqueue("importDataSource", { dataSourceId });
  return { code: 200 };
};
