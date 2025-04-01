import {
  findAreaByCode,
  findAreaByName,
  findAreasByPoint,
} from "@/server/repositories/Area";
import logger from "@/server/services/logger";
import { GeocodeResult, Point } from "@/types";
import { DataSourceGeocodingConfig } from "@/zod";

interface MappingDataRecord {
  externalId: string;
  json: Record<string, unknown>;
}

export const geocodeRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: DataSourceGeocodingConfig,
): Promise<GeocodeResult | null> => {
  try {
    return await _geocodeRecord(dataRecord, geocodingConfig);
  } catch (e) {
    logger.warn(`Could not geocode record ${dataRecord.externalId}`, { error: e });
  }
  return null;
};

const _geocodeRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: DataSourceGeocodingConfig,
): Promise<GeocodeResult> => {
  const dataRecordJson = dataRecord.json;
  // TODO: Implement the other types
  if (geocodingConfig.type !== "code") {
    throw new Error(`Unimplemented geocoding type: ${geocodingConfig.type}`);
  }

  const { column: areaColumn, areaSetCode } = geocodingConfig;
  if (!(areaColumn in dataRecordJson)) {
    throw new Error(`Missing area column "${areaColumn}" in row`);
  }

  let dataRecordArea = String(dataRecordJson[areaColumn]);
  let area = null;
  if (geocodingConfig.type === "code") {
    if (geocodingConfig.areaSetCode === "PC") {
      dataRecordArea = dataRecordArea.replace(/\s+/g, "").toUpperCase();
    }
    area = await findAreaByCode(dataRecordArea, areaSetCode);
  } else {
    area = await findAreaByName(dataRecordArea, areaSetCode);
  }
  if (!area) {
    throw new Error(
      `Area not found in area set ${areaSetCode}: ${dataRecordArea}`,
    );
  }
  const geocodeResult: GeocodeResult = {
    areas: {
      [areaSetCode]: area.code,
    },
    centralPoint: geojsonPointToPoint(area.centralPoint),
    samplePoint: geojsonPointToPoint(area.samplePoint),
  };

  const mappedAreas = await findAreasByPoint(
    area.samplePoint,
    geocodingConfig.areaSetCode,
  );
  for (const area of mappedAreas) {
    geocodeResult.areas[area.areaSetCode] = area.code;
  }

  return geocodeResult;
};

const geojsonPointToPoint = (geojson: string): Point | null => {
  if (!geojson) {
    return null;
  }
  const [lng, lat] = JSON.parse(geojson).coordinates;
  return { lng, lat };
};
