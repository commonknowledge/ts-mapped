import logger from "@/server/services/logger";
import { DataSourceType } from "@/types";
import { DataSourceConfig } from "@/zod";
import { AirtableAdaptor } from "./airtable";
import { CSVAdaptor } from "./csv";
import { GoogleSheetsAdaptor } from "./googlesheets";

export const getDataSourceAdaptor = (dataSource: {
  id: string;
  config: DataSourceConfig;
}) => {
  const { id, config } = dataSource;

  const dataSourceType = config.type;
  switch (dataSourceType) {
    case DataSourceType.airtable:
      return new AirtableAdaptor(
        id,
        config.apiKey,
        config.baseId,
        config.tableId,
      );
    case DataSourceType.csv:
      return new CSVAdaptor(config.url);
    case DataSourceType.googlesheets:
      return new GoogleSheetsAdaptor(
        id,
        config.spreadsheetId,
        config.sheetName,
        config.oAuthCredentials,
      );
    case DataSourceType.mailchimp:
    default:
      logger.error(`Unimplemented data source type: ${dataSourceType}`);
      return null;
  }
};
