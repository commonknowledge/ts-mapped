import { AirtableAdaptor } from "@/server/adaptors/airtable";
import { findDataSourcesByType } from "@/server/repositories/DataSource";
import { DataSourceType } from "@/types";
import { AirtableConfig } from "@/zod";

const refreshWebhooks = async (): Promise<boolean> => {
  const airtableDataSources = await findDataSourcesByType(
    DataSourceType.airtable,
  );
  for (const source of airtableDataSources) {
    const config = source.config as AirtableConfig;
    const adaptor = new AirtableAdaptor(
      config.apiKey,
      config.baseId,
      config.tableId,
    );
    const enable = source.autoEnrich || source.autoImport;
    await adaptor.toggleWebhook(source.id, enable);
  }
  return true;
};

export default refreshWebhooks;
