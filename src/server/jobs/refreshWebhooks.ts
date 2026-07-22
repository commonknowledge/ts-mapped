import { v4 as uuidv4 } from "uuid";
import {
  DataSourceType,
  airtableConfigSchema,
  baserowConfigSchema,
  googleSheetsConfigSchema,
} from "@/models/DataSource";
import { AirtableAdaptor } from "@/server/adaptors/airtable";
import { BaserowAdaptor } from "@/server/adaptors/baserow";
import { GoogleSheetsAdaptor } from "@/server/adaptors/googlesheets";
import {
  findDataSourceById,
  findDataSourcesByType,
} from "@/server/repositories/DataSource";
import { createWebhookRefreshLog } from "@/server/repositories/WebhookRefreshLog";
import { getDataSourceAdaptor } from "../adaptors";
import logger from "../services/logger";
import type { WebhookToggleResult } from "@/server/adaptors/abstract";

const logRefresh = async ({
  runId,
  dataSourceId,
  dataSourceType,
  enabled,
  result,
  error,
}: {
  runId: string;
  dataSourceId: string;
  dataSourceType: DataSourceType;
  enabled: boolean;
  result?: WebhookToggleResult;
  error?: unknown;
}): Promise<void> => {
  try {
    await createWebhookRefreshLog({
      runId,
      dataSourceId,
      dataSourceType,
      enabled,
      success: !error,
      action: error ? "failed" : result?.action || "noop",
      oldWebhookIds: result?.oldWebhookIds || [],
      newWebhookIds: result?.newWebhookIds || [],
      details: result?.details,
      error: error ? String(error) : undefined,
    });
  } catch (logError) {
    logger.warn(
      `Failed to write webhook refresh log for data source ${dataSourceId}`,
      { error: logError },
    );
  }
};

const refreshWebhooks = async (args: object | null): Promise<boolean> => {
  if (args && "dataSourceId" in args && typeof args.dataSourceId === "string") {
    return refreshWebhook(args.dataSourceId);
  }

  const runId = uuidv4();

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
      const toggleResult = await adaptor.toggleWebhook(enable);
      await logRefresh({
        runId,
        dataSourceId: source.id,
        dataSourceType: DataSourceType.Airtable,
        enabled: enable,
        result: toggleResult,
      });
    } catch (error) {
      logger.warn(
        `Failed to refresh airtable webhook for data source ${source.id}`,
        { error },
      );
      await logRefresh({
        runId,
        dataSourceId: source.id,
        dataSourceType: DataSourceType.Airtable,
        enabled: enable,
        error,
      });
      continue;
    }
  }

  const baserowDataSources = await findDataSourcesByType(
    DataSourceType.Baserow,
  );
  for (const source of baserowDataSources) {
    const result = baserowConfigSchema.safeParse(source.config);
    if (!result.success) {
      logger.warn(
        `Failed to parse Baserow config for data source ${source.id}`,
        { error: result.error },
      );
      continue;
    }
    const config = result.data;
    const adaptor = new BaserowAdaptor({
      dataSourceId: source.id,
      apiUrl: config.apiUrl,
      tableId: config.tableId,
      email: config.email,
      password: config.password,
    });
    const enable = source.autoEnrich || source.autoImport;
    try {
      const toggleResult = await adaptor.toggleWebhook(enable);
      await logRefresh({
        runId,
        dataSourceId: source.id,
        dataSourceType: DataSourceType.Baserow,
        enabled: enable,
        result: toggleResult,
      });
    } catch (error) {
      logger.warn(
        `Failed to refresh Baserow webhook for data source ${source.id}`,
        { error },
      );
      await logRefresh({
        runId,
        dataSourceId: source.id,
        dataSourceType: DataSourceType.Baserow,
        enabled: enable,
        error,
      });
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
    const enable = source.autoEnrich || source.autoImport;
    try {
      const toggleResult = await adaptor.toggleWebhook(enable);
      if (enable) {
        const hasErrors = await adaptor.hasWebhookErrors();
        if (hasErrors) {
          await adaptor.repairWebhook();
        }
      }
      await logRefresh({
        runId,
        dataSourceId: source.id,
        dataSourceType: DataSourceType.GoogleSheets,
        enabled: enable,
        result: toggleResult,
      });
    } catch (error) {
      logger.warn(
        `Failed to refresh Google Sheets webhook for data source ${source.id}`,
        { error },
      );
      await logRefresh({
        runId,
        dataSourceId: source.id,
        dataSourceType: DataSourceType.GoogleSheets,
        enabled: enable,
        error,
      });
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

  const runId = uuidv4();
  const dataSourceType = dataSource.config.type;
  try {
    const result = await adaptor.toggleWebhook(enable);
    await logRefresh({
      runId,
      dataSourceId,
      dataSourceType,
      enabled: enable,
      result,
    });
  } catch (error) {
    await logRefresh({
      runId,
      dataSourceId,
      dataSourceType,
      enabled: enable,
      error,
    });
    throw error;
  }
  return true;
};

export default refreshWebhooks;
