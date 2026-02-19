import { AirtableAdaptor } from "@/server/adaptors/airtable";
import {
  findDataSourceById,
  findDataSourcesByType,
} from "@/server/repositories/DataSource";
import { getDataSourceAdaptor } from "../adaptors";
import { DataSourceType, airtableConfigSchema } from "../models/DataSource";
import logger from "../services/logger";

const refreshWebhooks = async (args: object | null): Promise<boolean> => {
  if (args && "dataSourceId" in args && typeof args.dataSourceId === "string") {
    return refreshWebhook(args.dataSourceId);
  }

  const airtableDataSources = await findDataSourcesByType(
    DataSourceType.Airtable,
  );
  for (const source of airtableDataSources) {
    const result = airtableConfigSchema.safeParse(source.config);
    if (!result.success) {
      logger.warn(
        `Failed to parse airtable config for data source ${source.id}`,
        { error: result.error },
      );
      continue;
    }
    const config = result.data;
    const adaptor = new AirtableAdaptor(
      source.id,
      config.apiKey,
      config.baseId,
      config.tableId,
    );
    const enable = source.autoEnrich || source.autoImport;
    try {
      await adaptor.toggleWebhook(enable);
    } catch (error) {
      logger.warn(
        `Failed to refresh airtable webhook for data source ${source.id}`,
        { error },
      );
      continue;
    }
  }
  return true;
};

const refreshWebhook = async (dataSourceId: string): Promise<boolean> => {
  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.warn(
      `Failed to refresh data source webhook for ID: ${dataSourceId} (Data source not found)`,
    );
    return false;
  }
  const enable = dataSource.autoEnrich || dataSource.autoImport;
  const adaptor = getDataSourceAdaptor(dataSource);
  if (!adaptor) {
    logger.warn(
      `Failed to refresh data source webhook for ID: ${dataSourceId} (Could not create adaptor)`,
    );
    return false;
  }
  await adaptor.toggleWebhook(enable);
  return true;
};

export default refreshWebhooks;
