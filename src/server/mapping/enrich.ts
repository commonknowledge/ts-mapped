import { ColumnType } from "@/models/DataSource";
import { findAreaByCode } from "@/server/repositories/Area";
import { findAreaSetByCode } from "@/server/repositories/AreaSet";
import { findDataRecordByDataSourceAndAreaCode } from "@/server/repositories/DataRecord";
import {
  findDataSourceById,
  updateDataSource,
} from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { geocodeRecord } from "./geocode";
import type { EnrichedRecord, GeocodeResult } from "@/models/DataRecord";
import type {
  AreaEnrichment,
  ColumnDef,
  DataSource,
  DataSourceEnrichment,
  Enrichment,
} from "@/models/DataSource";
import type { ExternalRecord } from "@/types";

export const enrichRecord = async (
  record: ExternalRecord,
  dataSource: DataSource,
): Promise<EnrichedRecord> => {
  const recordStart = Date.now();
  logger.debug(`[enrichRecord ${record.externalId}] start`);
  const tGeo = Date.now();
  const geocodeResult = await geocodeRecord(record, dataSource.geocodingConfig);
  logger.debug(
    `[enrichRecord ${record.externalId}] geocodeRecord: ${Date.now() - tGeo}ms (type=${dataSource.geocodingConfig.type})`,
  );
  if (!geocodeResult) {
    logger.warn(
      `Enrichment failed for record ${record.externalId}: could not geocode`,
    );
    return { externalRecord: record, columns: [] };
  }

  const enrichedColumns = [];
  for (const enrichment of dataSource.enrichments) {
    const tCol = Date.now();
    const enrichedColumn = await getEnrichedColumn(
      record,
      geocodeResult,
      enrichment,
    );
    logger.debug(
      `[enrichRecord ${record.externalId}] getEnrichedColumn ${enrichment.sourceType}/${enrichment.name}: ${Date.now() - tCol}ms`,
    );
    if (enrichedColumn) {
      enrichedColumns.push({
        def: {
          name: enrichment.name,
          type: enrichedColumn.def.type,
        },
        value: enrichedColumn.value,
      });
    }
  }

  logger.debug(
    `[enrichRecord ${record.externalId}] total: ${Date.now() - recordStart}ms`,
  );
  logger.silly(
    `Enriched record ${record.externalId}: ${JSON.stringify(enrichedColumns)}`,
  );
  return { externalRecord: record, columns: enrichedColumns };
};

interface EnrichedColumn {
  def: ColumnDef;
  value: unknown;
}

export const getEnrichedColumn = async (
  record: ExternalRecord,
  recordGeocodeResult: GeocodeResult,
  enrichment: Enrichment,
): Promise<EnrichedColumn | null> => {
  try {
    if (enrichment.sourceType === "Area") {
      return await getAreaEnrichedColumn(recordGeocodeResult, enrichment);
    }
    if (enrichment.sourceType === "DataSource") {
      return await getDataSourceEnrichedColumn(recordGeocodeResult, enrichment);
    }
  } catch (error) {
    logger.warn(
      `${enrichment.sourceType} enrichment error for record ${record.externalId}`,
      { error },
    );
  }
  return null;
};

const getAreaEnrichedColumn = async (
  recordGeocodeResult: GeocodeResult,
  enrichment: AreaEnrichment,
): Promise<EnrichedColumn> => {
  const areaSet = await findAreaSetByCode(enrichment.areaSetCode);
  if (!areaSet) {
    throw new Error(
      `Could not find area set with code ${enrichment.areaSetCode}`,
    );
  }

  const areaCode = recordGeocodeResult.areas[areaSet.code];
  if (typeof areaCode !== "string") {
    throw new Error(
      `Record geocode result does not include the requested ${areaSet.code} area`,
    );
  }

  const area = await findAreaByCode(areaCode, areaSet.code);
  if (!area) {
    throw new Error(
      `Could not find area with code "${areaCode}" from requested set ${enrichment.areaSetCode}`,
    );
  }

  return {
    def: {
      name: areaSet.name,
      type: ColumnType.String,
    },
    value: area[enrichment.areaProperty],
  };
};

const getDataSourceEnrichedColumn = async (
  recordGeocodeResult: GeocodeResult,
  { dataSourceId, dataSourceColumn }: DataSourceEnrichment,
): Promise<EnrichedColumn> => {
  // TODO: security
  const dataSource = await findDataSourceById(dataSourceId);

  if (!dataSource) {
    throw new Error(`Could not find a data source with id ${dataSourceId}`);
  }

  if (!("areaSetCode" in dataSource.geocodingConfig)) {
    throw new Error(
      `Only data sources geocoded on area sets can be used for enrichment; ` +
        `${dataSourceId} is geocoded on ${dataSource.geocodingConfig.type}`,
    );
  }

  const areaSetCode = dataSource.geocodingConfig.areaSetCode;
  const recordArea = recordGeocodeResult?.areas[areaSetCode];
  if (!recordArea) {
    throw new Error(
      `Record geocode result does not include the ${areaSetCode} area required for matching`,
    );
  }

  const matchedRecord = await findDataRecordByDataSourceAndAreaCode(
    dataSourceId,
    areaSetCode,
    recordArea,
  );

  if (!matchedRecord) {
    throw new Error(
      `Could not find a matching data record for ${areaSetCode}: ${recordArea} ` +
        `in source ${dataSource.id}`,
    );
  }

  if (!(dataSourceColumn in matchedRecord.json)) {
    throw new Error(
      `Matched JSON does not include column "${dataSourceColumn}"`,
    );
  }

  const columnDef = dataSource.columnDefs.find(
    ({ name }) => name === dataSourceColumn,
  );

  return {
    def: {
      name: `${dataSource.name}: ${dataSourceColumn}`,
      type: columnDef?.type || ColumnType.Unknown,
    },
    value: matchedRecord.json[dataSourceColumn],
  };
};

/**
 * Synchronously removes enrichment columns from a data source's metadata:
 * - Filters matching entries out of `enrichments`
 * - Filters matching entries out of `columnDefs`
 *
 * The expensive work (stripping values from data_record.json and deleting
 * columns from the external source) is left to the background job.
 */
export const removeEnrichmentColumnsFromDataSource = async (
  dataSourceId: string,
  columnNames: string[],
) => {
  if (columnNames.length === 0) return;

  const dataSource = await findDataSourceById(dataSourceId);
  if (!dataSource) return;

  const namesToRemove = new Set(columnNames);

  const remainingEnrichments = (dataSource.enrichments ?? []).filter(
    (e) => !namesToRemove.has(e.name),
  );
  const remainingColumnDefs = (dataSource.columnDefs ?? []).filter(
    (col) => !namesToRemove.has(col.name),
  );

  await updateDataSource(dataSourceId, {
    enrichments: remainingEnrichments,
    columnDefs: remainingColumnDefs,
  });

  logger.info(
    `Removed enrichment column metadata [${columnNames.join(", ")}] from data source ${dataSourceId}`,
  );
};
