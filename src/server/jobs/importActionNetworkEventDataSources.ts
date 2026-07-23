import { findActionNetworkEventDataSources } from "@/server/repositories/DataSource";
import logger from "../services/logger";
import { enqueue } from "../services/queue";

// Action Network events have no webhook, so we keep event data sources fresh
// with a scheduled full re-import, the same way Zetkin sources are refreshed.
const importActionNetworkEventDataSources = async (): Promise<boolean> => {
  const dataSources = await findActionNetworkEventDataSources();
  for (const source of dataSources) {
    try {
      await enqueue("importDataSource", source.id, {
        dataSourceId: source.id,
      });
    } catch (error) {
      logger.warn(
        `Failed to enqueue import for Action Network event data source ${source.id}`,
        { error },
      );
      continue;
    }
    if (source.autoEnrich && source.enrichments.length > 0) {
      try {
        await enqueue("enrichDataSource", source.id, {
          dataSourceId: source.id,
        });
      } catch (error) {
        logger.warn(
          `Failed to enqueue enrichment for Action Network event data source ${source.id}`,
          { error },
        );
      }
    }
  }
  return true;
};

export default importActionNetworkEventDataSources;
