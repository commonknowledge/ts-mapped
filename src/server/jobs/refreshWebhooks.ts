import { AirtableAdaptor } from "@/server/adaptors/airtable";
import { findDataSourcesByType } from "@/server/repositories/DataSource";
import { DataSourceType, airtableConfigSchema } from "../models/DataSource";

const refreshWebhooks = async (): Promise<boolean> => {
  const airtableDataSources = await findDataSourcesByType(
    DataSourceType.Airtable,
  );
  for (const source of airtableDataSources) {
    const result = airtableConfigSchema.safeParse(source.config);
    if (!result.success) continue;
    const config = result.data;
    const adaptor = new AirtableAdaptor(
      source.id,
      config.apiKey,
      config.baseId,
      config.tableId,
    );
    const enable = source.autoEnrich || source.autoImport;
    await adaptor.toggleWebhook(enable);
  }
  return true;
};

export default refreshWebhooks;
