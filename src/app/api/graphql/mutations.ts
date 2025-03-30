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
      geocodingConfig: JSON.stringify(geocodingConfig),
      columnDefs: JSON.stringify(columnDefs),
    });

    logger.info(`Created ${config.type} data source: ${dataSource.id}`);
    return { code: 200, result: serializeDataSource(dataSource) };
  } catch (e) {
    logger.error(`Could not create data source: ${e}`);
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

export const updateDataSourceConfig = async (
  _: unknown,
  {
    id,
    columnsConfig,
    rawGeocodingConfig,
  }: {
    id: string;
    columnsConfig: ColumnsConfigInput;
    rawGeocodingConfig: object;
  },
): Promise<MutationResponse> => {
  try {
    const dataSource = await findDataSourceById(id);
    if (!dataSource) {
      return { code: 404 };
    }
    const geocodingConfig =
      DataSourceGeocodingConfigSchema.parse(rawGeocodingConfig);
    await updateDataSource(id, {
      columnsConfig: JSON.stringify(columnsConfig),
      geocodingConfig: JSON.stringify(geocodingConfig),
    });
    logger.info(
      `Updated ${dataSource.config.type} data source config: ${dataSource.id}`,
    );
    return { code: 200 };
  } catch (e) {
    logger.error(`Could not update data source: ${e}`);
  }
  return { code: 500 };
};
