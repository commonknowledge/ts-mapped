import { AirtableAdaptor } from "@/server/adaptors/airtable";
import { findDataSourcesByType } from "@/server/repositories/DataSource";
import { DataSourceType, airtableConfigSchema } from "../models/DataSource";
import logger from "../services/logger";

const refreshWebhooks = async (): Promise<boolean> => {
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

export default refreshWebhooks;
