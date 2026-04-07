import {
  DataSourceType,
  airtableConfigSchema,
  googleSheetsConfigSchema,
} from "@/models/DataSource";
import { AirtableAdaptor } from "@/server/adaptors/airtable";
import { GoogleSheetsAdaptor } from "@/server/adaptors/googlesheets";
import {
  findDataSourceById,
  findDataSourcesByType,
} from "@/server/repositories/DataSource";
import { getDataSourceAdaptor } from "../adaptors";
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

  const googleSheetsDataSources = await findDataSourcesByType(
    DataSourceType.GoogleSheets,
  );
  for (const source of googleSheetsDataSources) {
    const result = googleSheetsConfigSchema.safeParse(source.config);
    if (!result.success) {
      logger.warn(
        `Failed to parse Google Sheets config for data source ${source.id}`,
        { error: result.error },
      );
      continue;
    }
    const config = result.data;
    const adaptor = new GoogleSheetsAdaptor(
      source.id,
      config.spreadsheetId,
      config.sheetName,
      config.oAuthCredentials,
    );
    try {
      const hasErrors = await adaptor.hasWebhookErrors();
      if (hasErrors) {
        await adaptor.repairWebhook();
      }
    } catch (error) {
      logger.warn(
        `Failed to repair Google Sheets webhook for data source ${source.id}`,
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
