import logger from "@/server/services/logger";
import { DataSourceType } from "../models/DataSource";
import { ActionNetworkAdaptor } from "./actionnetwork";
import { AirtableAdaptor } from "./airtable";
import { CSVAdaptor } from "./csv";
import { GoogleSheetsAdaptor } from "./googlesheets";
import type { dataSourceConfigSchema } from "../models/DataSource";
import type z from "zod";

export const getDataSourceAdaptor = (dataSource: {
  id: string;
  config: z.infer<typeof dataSourceConfigSchema>;
}) => {
  const { id, config } = dataSource;

  const dataSourceType = config.type;
  switch (dataSourceType) {
    case DataSourceType.ActionNetwork:
      return new ActionNetworkAdaptor(config.apiKey);
    case DataSourceType.Airtable:
      return new AirtableAdaptor(
        id,
        config.apiKey,
        config.baseId,
        config.tableId,
      );
    case DataSourceType.CSV:
      return new CSVAdaptor(config.url);
    case DataSourceType.GoogleSheets:
      return new GoogleSheetsAdaptor(
        id,
        config.spreadsheetId,
        config.sheetName,
        config.oAuthCredentials,
      );
    case DataSourceType.Mailchimp:
    default:
      logger.error(`Unimplemented data source type: ${dataSourceType}`);
      return null;
  }
};
