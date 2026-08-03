import { sql } from "kysely";
import { getBooleanEnvVar } from "@/env";
import { AreaSetCode } from "@/models/AreaSet";
import { geocodeContextSchema } from "@/models/DataRecord";
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
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { geojsonPointToPoint } from "../utils/geo";
import type { GeocodeContext, GeocodeResult } from "@/models/DataRecord";
import type { Point } from "@/models/shared";
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

  let geocodeContext: GeocodeContext | null = null;
  if (!point) {
    const geocoded = await mapboxGeocode(address);
    point = geocoded.point;
    geocodeContext = geocoded.context;
    if (!point) {
      throw new Error(`Geocode request returned no features`);
    }
  }

  const geocodeResult: GeocodeResult = {
    areas,
    centralPoint: point,
    samplePoint: point,
    geocodeContext,
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

/**
 * Reverse geocode a point to its (nearest) postcode via postcodes.io.
 * Returns the formatted postcode (e.g. "PE25 3LS") or null when the point
 * has no nearby postcode or the request fails.
 */
export const reversePostcodeLookup = async (
  point: Point,
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes?lon=${point.lng}&lat=${point.lat}&limit=1`,
    );
    if (!response.ok) {
      return null;
    }
    const data: unknown = await response.json();
    if (
      data &&
      typeof data === "object" &&
      "result" in data &&
      Array.isArray(data.result) &&
      data.result.length > 0
    ) {
      const first: unknown = data.result[0];
      if (
        first &&
        typeof first === "object" &&
        "postcode" in first &&
        typeof first.postcode === "string" &&
        first.postcode
      ) {
        return first.postcode;
      }
    }
    return null;
  } catch (error) {
    logger.warn("Reverse postcode lookup failed", { error });
    return null;
  }
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

/** Safely parse a raw Mapbox `properties.context` value into our schema. */
const parseContext = (raw: unknown): GeocodeContext | null => {
  if (!raw) {
    return null;
  }
  const parsed = geocodeContextSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

const mapboxGeocode = async (
  address: string,
): Promise<{ point: Point | null; context: GeocodeContext | null }> => {
  const cached = await db
    .selectFrom("geocodeCache")
    .select(["point", "context"])
    .where("address", "=", address)
    .where("createdAt", ">", sql<Date>`now() - interval '4 weeks'`)
    .executeTakeFirst();

  if (cached) {
    logger.silly(`Geocode cache hit for "${address}"`);
    return { point: cached.point, context: parseContext(cached.context) };
  }

  logger.silly(`Geocode cache miss for "${address}", calling Mapbox API`);
  const geocodeUrl = new URL(
    "https://api.mapbox.com/search/geocode/v6/forward",
  );
  geocodeUrl.searchParams.set("q", address);
  geocodeUrl.searchParams.set("country", "GB");
  // Prefix matching is for typeahead search boxes, not batch geocoding of
  // known addresses: it lets "Worthing, West Sussex" match "West Sussex
  // County Council" in Chichester ahead of the town of Worthing
  geocodeUrl.searchParams.set("autocomplete", "false");
  geocodeUrl.searchParams.set(
    "access_token",
    process.env.MAPBOX_SECRET_TOKEN || "",
  );

  const response = await fetch(geocodeUrl);
  if (!response.ok) {
    throw new Error(`Geocode request failed: ${response.status}`);
  }
  const results = (await response.json()) as {
    features?: {
      id: string;
      geometry: GeoJSONPoint;
      properties?: { context?: unknown };
    }[];
  };

  const feature = results.features?.[0];
  const point: Point | null = feature
    ? {
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      }
    : null;
  const context = feature ? parseContext(feature.properties?.context) : null;

  await db
    .insertInto("geocodeCache")
    .values({ address, point, context })
    .onConflict((oc) =>
      oc
        .column("address")
        .doUpdateSet({ point, context, createdAt: sql`now()` }),
    )
    .execute();

  return { point, context };
};

/**
 * Reverse geocode a point to its Mapbox context (place, region, etc.), cached
 * by rounded coordinate key. Used by the Geocode enrichment for records that
 * were not forward-geocoded via Mapbox (e.g. postcode or coordinate sources).
 * The 4-week cache TTL matches Mapbox's Temporary Geocoding storage terms.
 */
export const mapboxReverseGeocode = async (
  point: Point,
): Promise<GeocodeContext | null> => {
  const key = `${point.lng.toFixed(5)},${point.lat.toFixed(5)}`;
  const cached = await db
    .selectFrom("reverseGeocodeCache")
    .select("context")
    .where("key", "=", key)
    .where("createdAt", ">", sql<Date>`now() - interval '4 weeks'`)
    .executeTakeFirst();

  if (cached) {
    logger.silly(`Reverse geocode cache hit for "${key}"`);
    return parseContext(cached.context);
  }

  logger.silly(`Reverse geocode cache miss for "${key}", calling Mapbox API`);
  const reverseUrl = new URL(
    "https://api.mapbox.com/search/geocode/v6/reverse",
  );
  reverseUrl.searchParams.set("longitude", String(point.lng));
  reverseUrl.searchParams.set("latitude", String(point.lat));
  reverseUrl.searchParams.set(
    "access_token",
    process.env.MAPBOX_SECRET_TOKEN || "",
  );

  const response = await fetch(reverseUrl);
  if (!response.ok) {
    throw new Error(`Reverse geocode request failed: ${response.status}`);
  }
  const results = (await response.json()) as {
    features?: { properties?: { context?: unknown } }[];
  };

  const context = parseContext(results.features?.[0]?.properties?.context);

  await db
    .insertInto("reverseGeocodeCache")
    .values({ key, context })
    .onConflict((oc) =>
      oc.column("key").doUpdateSet({ context, createdAt: sql`now()` }),
    )
    .execute();

  return context;
};
