import logger from "@/server/services/logger";
import { DataSourceType } from "@/types";
import { DataSourceConfig } from "@/zod";
import { AirtableAdaptor } from "./airtable";
import { CSVAdaptor } from "./csv";

export const getDataSourceAdaptor = (config: DataSourceConfig) => {
  const dataSourceType = config.type;
  switch (dataSourceType) {
    case DataSourceType.airtable:
      return new AirtableAdaptor(config.apiKey, config.baseId, config.tableId);
    case DataSourceType.csv:
      return new CSVAdaptor(config.idColumn, config.filename);
    case DataSourceType.mailchimp:
    default:
      logger.error(`Unimplemented data source type: ${dataSourceType}`);
      return null;
  }
};
