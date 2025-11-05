import {
  findAreaByCode,
  findAreaByName,
  findAreasByPoint,
} from "@/server/repositories/Area";
import logger from "@/server/services/logger";
import type {
  AddressGeocodingConfig,
  AreaGeocodingConfig,
  CoordinatesGeocodingConfig,
  GeocodingConfig,
} from "../models/DataSource";
import type { GeocodeResult, Point } from "../models/shared";
import type { Point as GeoJSONPoint } from "geojson";

interface MappingDataRecord {
  externalId: string;
  json: Record<string, unknown>;
}

export const geocodeRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: GeocodingConfig,
): Promise<GeocodeResult | null> => {
  try {
    return await _geocodeRecord(dataRecord, geocodingConfig);
  } catch (error) {
    logger.warn(`Could not geocode record ${dataRecord.externalId}`, {
      error,
    });
  }
  return null;
};

const _geocodeRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: GeocodingConfig,
): Promise<GeocodeResult> => {
  if (geocodingConfig.type === "Code" || geocodingConfig.type === "Name") {
    return geocodeRecordByArea(dataRecord, geocodingConfig);
  }
  if (geocodingConfig.type === "Address") {
    return geocodeRecordByAddress(dataRecord, geocodingConfig);
  }
  if (geocodingConfig.type === "Coordinates") {
    return geocodeRecordByCoordinates(dataRecord, geocodingConfig);
  }
  throw new Error(`Unimplemented geocoding type: ${geocodingConfig.type}`);
};

const geocodeRecordByArea = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: AreaGeocodingConfig,
) => {
  const dataRecordJson = dataRecord.json;
  const { column: areaColumn, areaSetCode } = geocodingConfig;
  if (!(areaColumn in dataRecordJson)) {
    throw new Error(`Missing area column "${areaColumn}" in row`);
  }

  let dataRecordArea = String(dataRecordJson[areaColumn]);
  let area = null;
  if (geocodingConfig.type === "Code") {
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

const geocodeRecordByAddress = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: AddressGeocodingConfig,
) => {
  const dataRecordJson = dataRecord.json;
  const { columns: addressColumns } = geocodingConfig;
  for (const addressColumn of addressColumns) {
    if (!(addressColumn in dataRecordJson)) {
      throw new Error(`Missing area column "${addressColumn}" in row`);
    }
  }

  // TODO: remove UK when other countries are supported
  const address = addressColumns.map((c) => dataRecordJson[c]).join(", ");
  const geocodeUrl = new URL(
    "https://api.mapbox.com/search/geocode/v6/forward",
  );
  geocodeUrl.searchParams.set("q", address);
  geocodeUrl.searchParams.set("country", "GB");
  geocodeUrl.searchParams.set(
    "access_token",
    process.env.MAPBOX_SECRET_TOKEN || "",
  );

  const response = await fetch(geocodeUrl);
  if (!response.ok) {
    throw new Error(`Geocode request failed: ${response.status}`);
  }
  const results = (await response.json()) as {
    features?: { id: string; geometry: GeoJSONPoint }[];
  };
  if (!results.features?.length) {
    throw new Error(`Geocode request returned no features`);
  }

  const feature = results.features[0];
  const point = {
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
  };

  const geocodeResult: GeocodeResult = {
    areas: {},
    centralPoint: point,
    samplePoint: point,
  };

  const mappedAreas = await findAreasByPoint(JSON.stringify(feature.geometry));
  for (const area of mappedAreas) {
    geocodeResult.areas[area.areaSetCode] = area.code;
  }

  return geocodeResult;
};

const geocodeRecordByCoordinates = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: CoordinatesGeocodingConfig,
) => {
  const dataRecordJson = dataRecord.json;
  const { latitudeColumn, longitudeColumn } = geocodingConfig;

  if (!(latitudeColumn in dataRecordJson)) {
    throw new Error(`Missing latitude column "${latitudeColumn}" in row`);
  }
  if (!(longitudeColumn in dataRecordJson)) {
    throw new Error(`Missing longitude column "${longitudeColumn}" in row`);
  }

  const lat = Number(dataRecordJson[latitudeColumn]);
  const lng = Number(dataRecordJson[longitudeColumn]);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(
      `Invalid coordinates: latitude=${dataRecordJson[latitudeColumn]}, longitude=${dataRecordJson[longitudeColumn]}`,
    );
  }

  const point = { lat, lng };
  const geocodeResult: GeocodeResult = {
    areas: {},
    centralPoint: point,
    samplePoint: point,
  };

  const mappedAreas = await findAreasByPoint(JSON.stringify({
    type: "Point",
    coordinates: [lng, lat],
  }));
  for (const area of mappedAreas) {
    geocodeResult.areas[area.areaSetCode] = area.code;
  }

  return geocodeResult;
};

const geojsonPointToPoint = (geojson: string): Point | null => {
  if (!geojson) {
    return null;
  }
  const [lng, lat] = (JSON.parse(geojson) as { coordinates: [number, number] })
    .coordinates;
  return { lng, lat };
};
