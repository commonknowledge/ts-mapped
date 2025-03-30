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

export const mapRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: DataSourceGeocodingConfig,
): Promise<Record<string, object | null>> => {
  const geocodeResult = await geocodeRecord(dataRecord, geocodingConfig);
  if (!geocodeResult) {
    logger.warn(`Could not geocode record ${dataRecord.externalId}`);
  }
  return { geocodeResult };
};

const geocodeRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: DataSourceGeocodingConfig,
): Promise<GeocodeResult | null> => {
  const dataRecordJson = dataRecord.json;
  // TODO: Implement the other types
  if (geocodingConfig.type !== "code") {
    return null;
  }

  const { column: areaColumn, areaSetCode } = geocodingConfig;
  if (!(areaColumn in dataRecordJson)) {
    return null;
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
    return null;
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
