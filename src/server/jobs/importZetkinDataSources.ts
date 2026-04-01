import { DataSourceType } from "@/models/DataSource";
import { findDataSourcesByType } from "@/server/repositories/DataSource";
import logger from "../services/logger";
import { enqueue } from "../services/queue";

const importZetkinDataSources = async (): Promise<boolean> => {
  const zetkinDataSources = await findDataSourcesByType(DataSourceType.Zetkin);
  for (const source of zetkinDataSources) {
    try {
      await enqueue("importDataSource", source.id, {
        dataSourceId: source.id,
      });
    } catch (error) {
      logger.warn(
        `Failed to enqueue import for Zetkin data source ${source.id}`,
        { error },
      );
      continue;
    }
  }
  return true;
};

export default importZetkinDataSources;
