import {
  findAreaByCode,
  findAreaByName,
  findAreasByPoint,
} from "@/server/repositories/Area";
import logger from "@/server/services/logger";
import { AreaSetCode } from "../models/AreaSet";
import type {
  AddressGeocodingConfig,
  AreaGeocodingConfig,
  CoordinatesGeocodingConfig,
  GeocodingConfig,
} from "../models/DataSource";
import type { GeocodeResult, Point } from "../models/shared";
import type { Point as GeoJSONPoint } from "geojson";

interface PostcodeResult {
  postcode: string;
  latitude: number;
  longitude: number;
}

export type { PostcodeResult };

/**
 * Bulk lookup postcodes using postcodes.io API
 * Maximum 100 postcodes per request
 * Returns a Map with successful results and a Set of postcodes that were not found
 */
export async function bulkFetchPostcodes(postcodes: string[]): Promise<{
  results: Map<string, PostcodeResult>;
  notFound: Set<string>;
}> {
  if (postcodes.length === 0) {
    return { results: new Map(), notFound: new Set() };
  }

  const results = new Map<string, PostcodeResult>();
  const notFound = new Set<string>();
  const normalizedPostcodes = postcodes.map((pc) =>
    pc.replace(/\s+/g, "").toUpperCase(),
  );

  // postcodes.io supports max 100 postcodes per request
  const chunks = [];
  for (let i = 0; i < normalizedPostcodes.length; i += 100) {
    chunks.push(normalizedPostcodes.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch("https://api.postcodes.io/postcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcodes: chunk }),
      });

      if (!response.ok) {
        logger.warn(`Bulk postcodes.io request failed: ${response.status}`);
        // Mark all postcodes in this chunk as not found to avoid individual retries
        chunk.forEach((pc) => notFound.add(pc));
        continue;
      }

      const data = (await response.json()) as {
        result?: {
          query: string;
          result: PostcodeResult | null;
        }[];
      };

      if (data.result) {
        for (const item of data.result) {
          const normalizedPC = item.query.replace(/\s+/g, "").toUpperCase();
          if (item.result) {
            results.set(normalizedPC, item.result);
          } else {
            // Postcode not found in API - track it to avoid individual retry
            notFound.add(normalizedPC);
          }
        }
      }
    } catch (error) {
      logger.warn("Bulk postcodes.io request error", { error });
      // Mark all postcodes in this chunk as not found to avoid individual retries
      chunk.forEach((pc) => notFound.add(pc));
    }
  }

  return { results, notFound };
}

interface MappingDataRecord {
  externalId: string;
  json: Record<string, unknown>;
}

export const geocodeRecord = async (
  dataRecord: MappingDataRecord,
  geocodingConfig: GeocodingConfig,
  prefetchedPostcodes?: {
    results: Map<string, PostcodeResult>;
    notFound: Set<string>;
  },
): Promise<GeocodeResult | null> => {
  try {
    return await _geocodeRecord(
      dataRecord,
      geocodingConfig,
      prefetchedPostcodes,
    );
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
  prefetchedPostcodes?: {
    results: Map<string, PostcodeResult>;
    notFound: Set<string>;
  },
): Promise<GeocodeResult> => {
  if (geocodingConfig.type === "Code" || geocodingConfig.type === "Name") {
    if (geocodingConfig.areaSetCode === AreaSetCode.PC) {
      return geocodeRecordByPostcode(
        dataRecord,
        geocodingConfig,
        prefetchedPostcodes,
      );
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
  prefetchedPostcodes?: {
    results: Map<string, PostcodeResult>;
    notFound: Set<string>;
  },
) => {
  try {
    return await geocodeRecordByArea(dataRecord, geocodingConfig);
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

  // Check if we already tried to bulk fetch this postcode and it wasn't found
  if (prefetchedPostcodes?.notFound.has(postcode)) {
    throw new Error(`Postcode not found in bulk lookup: ${postcode}`);
  }

  // Check if we have a prefetched result
  let postcodeData = prefetchedPostcodes?.results.get(postcode);

  // If not prefetched, make individual API call
  if (!postcodeData) {
    const postcodesResponse = await fetch(
      `https://api.postcodes.io/postcodes/${postcode}`,
    );
    if (!postcodesResponse.ok) {
      const text = (await postcodesResponse.text()) || "Unknown error";
      throw new Error(
        `Failed postcodes.io request: ${postcodesResponse.status}, ${text}`,
      );
    }
    const postcodesResponseData = await postcodesResponse.json();
    if (
      !postcodesResponseData ||
      !(typeof postcodesResponseData === "object") ||
      !("result" in postcodesResponseData) ||
      !postcodesResponseData.result ||
      !(typeof postcodesResponseData.result === "object") ||
      !("postcode" in postcodesResponseData.result) ||
      !("latitude" in postcodesResponseData.result) ||
      !("longitude" in postcodesResponseData.result) ||
      !postcodesResponseData.result.postcode ||
      !postcodesResponseData.result.latitude ||
      !postcodesResponseData.result.longitude
    ) {
      throw new Error(
        `Bad postcodes.io response: ${JSON.stringify(postcodesResponseData)}`,
      );
    }
    postcodeData = {
      postcode: String(postcodesResponseData.result.postcode),
      latitude: Number(postcodesResponseData.result.latitude),
      longitude: Number(postcodesResponseData.result.longitude),
    };
  }

  if (!postcodeData) {
    throw new Error(`Could not fetch postcode data for ${postcode}`);
  }

  const samplePoint = {
    lat: Number(postcodeData.latitude),
    lng: Number(postcodeData.longitude),
  };

  const geocodeResult: GeocodeResult = {
    areas: {
      [AreaSetCode.PC]: String(postcodeData.postcode)
        .replace(/\s+/g, "")
        .toUpperCase(),
    },
    centralPoint: samplePoint,
    samplePoint,
  };

  const mappedAreas = await findAreasByPoint({
    point: JSON.stringify({
      type: "Point",
      coordinates: [samplePoint.lng, samplePoint.lat],
    }),
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
    // TODO: Better fuzzy matching logic
    dataRecordArea = dataRecordArea.replace(/green party$/i, "").trim();
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
    point: area.samplePoint,
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
  for (const addressColumn of addressColumns) {
    if (!(addressColumn in dataRecordJson)) {
      throw new Error(`Missing area column "${addressColumn}" in row`);
    }
  }

  // TODO: remove UK when other countries are supported
  const address = addressColumns
    .map((c) => dataRecordJson[c] || "")
    .filter(Boolean)
    .join(", ");
  if (!address) {
    throw new Error("Missing address in row");
  }
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

  const mappedAreas = await findAreasByPoint({
    point: JSON.stringify(feature.geometry),
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
    point: JSON.stringify({
      type: "Point",
      coordinates: [lng, lat],
    }),
  });
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
