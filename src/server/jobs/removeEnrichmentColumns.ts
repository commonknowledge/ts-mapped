import { sql } from "kysely";
import { getDataSourceAdaptor } from "@/server/adaptors";
import { findDataSourceById } from "@/server/repositories/DataSource";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";

const removeEnrichmentColumns = async (
  args: object | null,
): Promise<boolean> => {
  if (
    !args ||
    !("dataSourceId" in args) ||
    !("externalColumnNames" in args) ||
    !Array.isArray(args.externalColumnNames)
  ) {
    return false;
  }

  const dataSourceId = String(args.dataSourceId);
  const externalColumnNames: string[] = args.externalColumnNames.map(String);

  if (externalColumnNames.length === 0) {
    return true;
  }

  logger.info(
    `Removing enrichment columns [${externalColumnNames.join(", ")}] from data source ${dataSourceId}`,
  );

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) {
    logger.info(`Data source ${dataSourceId} not found.`);
    return false;
  }

  // 1. Remove the columns from the external data source via the adaptor
  const adaptor = getDataSourceAdaptor(dataSource);
  if (adaptor) {
    for (const columnName of externalColumnNames) {
      try {
        await adaptor.deleteColumn(columnName);
        logger.info(
          `Removed column "${columnName}" from external source for ${dataSourceId}`,
        );
      } catch (error) {
        logger.error(
          `Failed to remove column "${columnName}" from external source for ${dataSourceId}`,
          { error },
        );
      }
    }
  }

  // 2. Remove the columns from data_record.json for all records
  for (const columnName of externalColumnNames) {
    try {
      await sql`
        UPDATE data_record
        SET json = json - ${columnName}
        WHERE data_source_id = ${dataSourceId}
      `.execute(db);
      logger.info(
        `Removed "${columnName}" from data_record.json for data source ${dataSourceId}`,
      );
    } catch (error) {
      logger.error(
        `Failed to remove "${columnName}" from data_record.json for data source ${dataSourceId}`,
        { error },
      );
    }
  }

  // 3. Remove the columns from the data source's columnDefs
  const updatedColumnDefs = (dataSource.columnDefs ?? []).filter(
    (col) => !externalColumnNames.includes(col.name),
  );
  await db
    .updateTable("dataSource")
    .set({ columnDefs: JSON.stringify(updatedColumnDefs) as never })
    .where("id", "=", dataSourceId)
    .execute();

  logger.info(
    `Finished removing enrichment columns from data source ${dataSourceId}`,
  );

  return true;
};

export default removeEnrichmentColumns;
