import { ColumnDef, ColumnType } from "@/__generated__/types";
import { DataSource } from "@/server/models/DataSource";
import { findAreaByCode } from "@/server/repositories/Area";
import { findAreaSetByCode } from "@/server/repositories/AreaSet";
import { findDataRecordByDataSourceAndAreaCode } from "@/server/repositories/DataRecord";
import { findDataSourceById } from "@/server/repositories/DataSource";
import logger from "@/server/services/logger";
import { ExternalRecord, GeocodeResult } from "@/types";
import { AreaEnrichment, DataSourceEnrichment, Enrichment } from "@/zod";
import { geocodeRecord } from "./geocode";

export interface EnrichedRecord {
  externalId: string;
  columns: {
    def: ColumnDef;
    value: unknown;
  }[];
}

export const enrichRecord = async (
  record: ExternalRecord,
  dataSource: DataSource,
) => {
  const geocodeResult = await geocodeRecord(record, dataSource.geocodingConfig);
  if (!geocodeResult) {
    logger.warn(
      `Enrichment failed for record ${record.externalId}: could not geocode`,
    );
    return { externalId: record.externalId, columns: [] };
  }

  const enrichedColumns = [];
  for (const enrichmentCo of dataSource.enrichments) {
    const enrichedColumn = await getEnrichedColumn(
      record,
      geocodeResult,
      enrichmentCo,
    );
    if (enrichedColumn) {
      enrichedColumns.push({
        def: {
          name: `Mapped: ${enrichedColumn.def.name}`,
          type: enrichedColumn.def.type,
        },
        value: enrichedColumn.value,
      });
    }
  }

  logger.info(
    `Enriched record ${record.externalId}: ${JSON.stringify(enrichedColumns)}`,
  );
  return { externalId: record.externalId, columns: enrichedColumns };
};

const getEnrichedColumn = async (
  record: ExternalRecord,
  recordGeocodeResult: GeocodeResult,
  enrichmentCo: Enrichment,
): Promise<EnrichedRecord["columns"][0] | null> => {
  try {
    if (enrichmentCo.sourceType === "Area") {
      return await getAreaEnrichedColumn(recordGeocodeResult, enrichmentCo);
    }
    if (enrichmentCo.sourceType === "DataSource") {
      return await getDataSourceEnrichedColumn(
        recordGeocodeResult,
        enrichmentCo,
      );
    }
  } catch (error) {
    logger.warn(
      `${enrichmentCo.sourceType} enrichment error for record ${record.externalId}`,
      { error },
    );
  }
  return null;
};

const getAreaEnrichedColumn = async (
  recordGeocodeResult: GeocodeResult,
  enrichmentCo: AreaEnrichment,
): Promise<EnrichedRecord["columns"][0]> => {
  const areaSet = await findAreaSetByCode(enrichmentCo.areaSetCode);
  if (!areaSet) {
    throw new Error(
      `Could not find area set with code ${enrichmentCo.areaSetCode}`,
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
      `Could not find area with code "${areaCode}" from requested set ${enrichmentCo.areaSetCode}`,
    );
  }

  return {
    def: {
      name: areaSet.name,
      type: ColumnType.String,
    },
    value: area[enrichmentCo.areaProperty],
  };
};

const getDataSourceEnrichedColumn = async (
  recordGeocodeResult: GeocodeResult,
  { dataSourceId, dataSourceColumn }: DataSourceEnrichment,
): Promise<EnrichedRecord["columns"][0]> => {
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
