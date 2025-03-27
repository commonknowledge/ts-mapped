import { DataSourceConfig } from "@/server/models/DataSource";
import logger from "@/server/services/logger";
import { AirtableAdaptor } from "./airtable";
import { CSVAdaptor } from "./csv";

export const getDataSourceAdaptor = (config: DataSourceConfig) => {
  const dataSourceType = config.type;
  switch (dataSourceType) {
    case "airtable":
      return new AirtableAdaptor(config.apiKey, config.baseId, config.tableId);
    case "csv":
      return new CSVAdaptor(config.idColumn, config.filename);
    case "mailchimp":
    default:
      logger.error(`Unimplemented data source type: ${dataSourceType}`);
      return null;
  }
};
