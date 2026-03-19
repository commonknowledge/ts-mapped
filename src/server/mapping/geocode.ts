import { getBooleanEnvVar } from "@/env";
import { AreaSetCode } from "@/models/AreaSet";
import {
  type AddressGeocodingConfig,
  type AreaGeocodingConfig,
  type CoordinatesGeocodingConfig,
  type GeocodingConfig,
  GeocodingType,
} from "@/models/DataSource";
import {
  findAreaByCode,
  findAreaByName,
  findAreasByPoint,
} from "@/server/repositories/Area";
import logger from "@/server/services/logger";
import { geojsonPointToPoint } from "../utils/geo";
import type { GeocodeResult, Point } from "@/models/shared";
import type { Point as GeoJSONPoint } from "geojson";

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

interface MappingDataRecord {
  externalId: string;
  json: Record<string, unknown>;
}

export const geocodeRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: GeocodingConfig,
): Promise<GeocodeResult | null> => {
  try {
    if (geocodingConfig.type !== GeocodingType.None) {
      return await _geocodeRecord(dataRecord, geocodingConfig);
    }
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
    if (geocodingConfig.areaSetCode === AreaSetCode.PC) {
      return geocodeRecordByPostcode(dataRecord, geocodingConfig);
    } else {
      return geocodeRecordByArea(dataRecord, geocodingConfig);
    }
  }
  if (geocodingConfig.type === "Address") {
    return geocodeRecordByAddress(dataRecord, geocodingConfig);
  }
  if (geocodingConfig.type === "Coordinates") {
    return geocodeRecordByCoordinates(dataRecord, geocodingConfig);
  }
  throw new Error(`Unimplemented geocoding type: ${geocodingConfig.type}`);
};

const geocodeRecordByPostcode = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: AreaGeocodingConfig,
) => {
  try {
    if (getBooleanEnvVar("ENABLE_DATABASE_POSTCODE_LOOKUP")) {
      return await geocodeRecordByArea(dataRecord, geocodingConfig);
    }
  } catch (error) {
    logger.warn(
      "Postcode lookup in database failed, attempting fallback to postcodes.io API",
      { error },
    );
  }
  const dataRecordJson = dataRecord.json;
  const { column: areaColumn } = geocodingConfig;
  if (!(areaColumn in dataRecordJson)) {
    throw new Error(`Missing postcode column "${areaColumn}" in row`);
  }
  const postcode = String(dataRecordJson[areaColumn] || "")
    .replace(/\s+/g, "")
    .toUpperCase();
  if (!postcode) {
    throw new Error("Missing postcode in row");
  }
  const postcodesData = await postcodesIOLookup(postcode);

  const samplePoint = {
    lat: Number(postcodesData.result.latitude),
    lng: Number(postcodesData.result.longitude),
  };

  const geocodeResult: GeocodeResult = {
    areas: {
      [AreaSetCode.PC]: String(postcodesData.result.postcode)
        .replace(/\s+/g, "")
        .toUpperCase(),
    },
    centralPoint: samplePoint,
    samplePoint,
  };

  const mappedAreas = await findAreasByPoint({
    point: samplePoint,
    excludeAreaSetCode: geocodingConfig.areaSetCode,
  });
  for (const area of mappedAreas) {
    geocodeResult.areas[area.areaSetCode] = area.code;
  }

  return geocodeResult;
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

  let dataRecordArea = String(dataRecordJson[areaColumn] || "");
  if (!dataRecordArea) {
    throw new Error("Missing area in row");
  }
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

  const mappedAreas = await findAreasByPoint({
    point: geocodeResult.samplePoint,
    excludeAreaSetCode: geocodingConfig.areaSetCode,
  });
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
  const hasColumn = addressColumns.some((c) => c in dataRecordJson);
  if (!hasColumn) {
    throw new Error(
      `Missing address columns "${addressColumns.join(", ")}" in row`,
    );
  }

  // TODO: remove UK when other countries are supported
  const address = addressColumns
    .map((c) => dataRecordJson[c] || "")
    .filter(Boolean)
    .join(", ")
    .trim();
  if (!address) {
    throw new Error("Missing address in row");
  }
  let point: Point | null = null;
  const areas: Partial<Record<AreaSetCode, string>> = {};
  if (POSTCODE_REGEX.test(address)) {
    try {
      const lookup = await postcodeLookup(address);
      areas[AreaSetCode.PC] = lookup.code;
      point = lookup.point;
    } catch (error) {
      logger.warn(
        "Postcodes.io lookup failed, falling back to address geocoder",
        { error },
      );
    }
  }

  if (!point) {
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
    point = {
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    };
  }

  const geocodeResult: GeocodeResult = {
    areas,
    centralPoint: point,
    samplePoint: point,
  };

  const mappedAreas = await findAreasByPoint({
    point,
    excludeAreaSetCode: AreaSetCode.PC in areas ? AreaSetCode.PC : null,
  });
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

  const mappedAreas = await findAreasByPoint({
    point,
  });
  for (const area of mappedAreas) {
    geocodeResult.areas[area.areaSetCode] = area.code;
  }

  return geocodeResult;
};

interface PostcodesIOResult {
  postcode: string;
  latitude: number;
  longitude: number;
}

const postcodeLookup = async (
  postcode: string,
): Promise<{ code: string; point: Point }> => {
  const areaCode = postcode.replace(/\s+/g, "").toUpperCase();
  if (getBooleanEnvVar("ENABLE_DATABASE_POSTCODE_LOOKUP")) {
    const area = await findAreaByCode(areaCode, AreaSetCode.PC);
    const point = geojsonPointToPoint(area?.samplePoint);
    if (area && point) {
      return { code: area.code, point };
    }
  }
  const postcodeData = await postcodesIOLookup(postcode);
  return {
    code: postcodeData.result.postcode,
    point: {
      lat: postcodeData.result.latitude,
      lng: postcodeData.result.longitude,
    },
  };
};

const postcodesIOLookup = async (
  postcode: string,
): Promise<{ result: PostcodesIOResult }> => {
  const postcodesResponse = await fetch(
    `https://api.postcodes.io/postcodes/${postcode}`,
  );
  if (!postcodesResponse.ok) {
    const text = (await postcodesResponse.text()) || "Unknown error";
    throw new Error(
      `Failed postcodes.io request: ${postcodesResponse.status}, ${text}`,
    );
  }
  const postcodesData = await postcodesResponse.json();
  if (
    !postcodesData ||
    !(typeof postcodesData === "object") ||
    !("result" in postcodesData) ||
    !postcodesData.result ||
    !(typeof postcodesData.result === "object") ||
    !("postcode" in postcodesData.result) ||
    !("latitude" in postcodesData.result) ||
    !("longitude" in postcodesData.result) ||
    !postcodesData.result.postcode ||
    !postcodesData.result.latitude ||
    !postcodesData.result.longitude ||
    !(typeof postcodesData.result.postcode === "string") ||
    !(typeof postcodesData.result.latitude === "number") ||
    !(typeof postcodesData.result.longitude === "number")
  ) {
    throw new Error(
      `Bad postcodes.io response: ${JSON.stringify(postcodesData)}`,
    );
  }
  return {
    result: {
      postcode: postcodesData.result.postcode,
      latitude: postcodesData.result.latitude,
      longitude: postcodesData.result.longitude,
    },
  };
};
