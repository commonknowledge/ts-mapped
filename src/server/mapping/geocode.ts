import {
  findAreasByCodes,
  findAreasByNames,
  findAreasByPoints,
} from "@/server/repositories/Area";
import logger from "@/server/services/logger";
import { AreaSetCode } from "../models/AreaSet";
import { batch } from "../utils";
import type {
  AddressGeocodingConfig,
  AreaGeocodingConfig,
  CoordinatesGeocodingConfig,
  GeocodingConfig,
} from "../models/DataSource";
import type { GeocodeResult, Point } from "../models/shared";
import type { AreaMatch } from "@/server/repositories/Area";
import type { Point as GeoJSONPoint } from "geojson";

interface GeocodePipelineRecord {
  externalId: string;
  error?: string | null;
  search?: string;
  samplePointGeoJSON?: string;
  geocodeResult?: GeocodeResult;
}

interface MappingDataRecord {
  externalId: string;
  json: Record<string, unknown>;
}

export const geocodeRecords = async (
  dataRecords: MappingDataRecord[],
  geocodingConfig: GeocodingConfig,
): Promise<GeocodePipelineRecord[]> => {
  const results = await _geocodeRecords(dataRecords, geocodingConfig);
  for (const result of results) {
    if (result.error)
      logger.warn(
        `Could not geocode record ${result.externalId}: ${result.error}`,
      );
  }
  return results;
};

const _geocodeRecords = async (
  dataRecords: MappingDataRecord[],
  geocodingConfig: GeocodingConfig,
): Promise<GeocodePipelineRecord[]> => {
  if (geocodingConfig.type === "Code" || geocodingConfig.type === "Name") {
    if (geocodingConfig.areaSetCode === AreaSetCode.PC) {
      return geocodeRecordsByPostcode(dataRecords, geocodingConfig);
    } else {
      return geocodeRecordsByArea(dataRecords, geocodingConfig);
    }
  }
  if (geocodingConfig.type === "Address") {
    return geocodeRecordsByAddress(dataRecords, geocodingConfig);
  }
  if (geocodingConfig.type === "Coordinates") {
    return geocodeRecordsByCoordinates(dataRecords, geocodingConfig);
  }
  throw new Error(`Unimplemented geocoding type: ${geocodingConfig.type}`);
};

const geocodeRecordsByPostcode = async (
  dataRecords: MappingDataRecord[],
  geocodingConfig: AreaGeocodingConfig,
) => {
  const geocodePipelineRecords = await geocodeRecordsByArea(
    dataRecords,
    geocodingConfig,
  );

  const recordsToTry = geocodePipelineRecords.filter(
    (r) => !r.geocodeResult && r.search,
  );
  const batches = batch(recordsToTry, 100);
  for (const recordBatch of batches) {
    const postcodesResponse = await fetch(
      `https://api.postcodes.io/postcodes`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ postcodes: recordBatch.map((r) => r.search) }),
      },
    );

    if (!postcodesResponse.ok) {
      const text = (await postcodesResponse.text()) || "Unknown error";
      const error = `Failed postcodes.io request: ${postcodesResponse.status}, ${text}`;
      for (const r of recordBatch) {
        r.error = error;
      }
      continue;
    }

    const postcodesData = await postcodesResponse.json();
    if (
      !postcodesData ||
      typeof postcodesData !== "object" ||
      !("result" in postcodesData) ||
      !Array.isArray(postcodesData.result)
    ) {
      const error = `Bad postcodes.io response: ${JSON.stringify(postcodesData)}`;
      for (const r of recordBatch) {
        r.error = error;
      }
      continue;
    }

    postcodesData.result.forEach((postcodesItem, i) => {
      if (
        !postcodesItem ||
        !(typeof postcodesItem === "object") ||
        !("result" in postcodesItem) ||
        !postcodesItem.result ||
        !(typeof postcodesItem.result === "object") ||
        !("postcode" in postcodesItem.result) ||
        !("latitude" in postcodesItem.result) ||
        !("longitude" in postcodesItem.result) ||
        !postcodesItem.result.postcode ||
        !postcodesItem.result.latitude ||
        !postcodesItem.result.longitude
      ) {
        recordBatch[i].error =
          `Bad postcodes.io response: ${JSON.stringify(postcodesData)}`;
        return;
      }

      const samplePoint = {
        lat: Number(postcodesItem.result.latitude),
        lng: Number(postcodesItem.result.longitude),
      };

      recordBatch[i].error = null;
      recordBatch[i].samplePointGeoJSON = JSON.stringify({
        type: "Point",
        coordinates: [samplePoint.lng, samplePoint.lat],
      });
      recordBatch[i].geocodeResult = {
        areas: {
          [AreaSetCode.PC]: String(postcodesItem.result.postcode)
            .replace(/\s+/g, "")
            .toUpperCase(),
        },
        centralPoint: samplePoint,
        samplePoint,
      };
    });

    const mappedAreas = await findAreasByPoints({
      points: recordBatch
        .map((r) => r.samplePointGeoJSON)
        .filter((p) => p !== undefined),
      excludeAreaSetCode: geocodingConfig.areaSetCode,
    });

    recordBatch.forEach((record) => {
      if (record.geocodeResult) {
        const matchedMappedAreas = mappedAreas.filter(
          (mappedArea) => mappedArea.input === record.samplePointGeoJSON,
        );
        for (const area of matchedMappedAreas) {
          const { areaSetCode, code } = area;
          if (areaSetCode && code) {
            record.geocodeResult.areas[areaSetCode] = code;
          }
        }
      }
    });
  }

  return geocodePipelineRecords;
};

const geocodeRecordsByArea = async (
  dataRecords: MappingDataRecord[],
  geocodingConfig: AreaGeocodingConfig,
) => {
  const { column: areaColumn, areaSetCode } = geocodingConfig;
  const geocodePipelineRecords: GeocodePipelineRecord[] = dataRecords.map(
    (dataRecord) => {
      const dataRecordJson = dataRecord.json;
      if (!(areaColumn in dataRecordJson)) {
        return {
          externalId: dataRecord.externalId,
          error: `Missing area column "${areaColumn}" in row`,
        };
      }

      let dataRecordArea = String(dataRecordJson[areaColumn] || "");
      if (!dataRecordArea) {
        return {
          externalId: dataRecord.externalId,
          error: "Missing area in row",
        };
      }
      if (geocodingConfig.type === "Code") {
        if (geocodingConfig.areaSetCode === "PC") {
          dataRecordArea = dataRecordArea.replace(/\s+/g, "").toUpperCase();
        }
      }
      return { externalId: dataRecord.externalId, search: dataRecordArea };
    },
  );

  let areas: AreaMatch[] = [];
  if (geocodingConfig.type === "Code") {
    areas = await findAreasByCodes(
      geocodePipelineRecords
        .map((a) => a.search)
        .filter((s) => s !== undefined),
      areaSetCode,
    );
  } else {
    areas = await findAreasByNames(
      geocodePipelineRecords
        .map((a) => a.search)
        .filter((s) => s !== undefined),
      areaSetCode,
    );
  }

  geocodePipelineRecords.forEach((geocodePipelineRecord) => {
    if (geocodePipelineRecord.error) {
      return;
    }
    const matchedArea = areas.find(
      (a) => a.input === geocodePipelineRecord.search,
    );
    if (
      !matchedArea ||
      !matchedArea.code ||
      !matchedArea.centralPoint ||
      !matchedArea.samplePoint
    ) {
      geocodePipelineRecord.error = `Area not found in area set ${areaSetCode}: ${geocodePipelineRecord.search}`;
      return;
    }
    const geocodeResult: GeocodeResult = {
      areas: {
        [areaSetCode]: matchedArea.code,
      },
      centralPoint: geojsonPointToPoint(matchedArea.centralPoint),
      samplePoint: geojsonPointToPoint(matchedArea.samplePoint),
    };
    geocodePipelineRecord.samplePointGeoJSON = matchedArea.samplePoint;
    geocodePipelineRecord.geocodeResult = geocodeResult;
  });

  const mappedAreas = await findAreasByPoints({
    points: geocodePipelineRecords
      .map((r) => r.samplePointGeoJSON)
      .filter((p) => p !== undefined),
    excludeAreaSetCode: geocodingConfig.areaSetCode,
  });

  geocodePipelineRecords.forEach((geocodePipelineRecord) => {
    if (geocodePipelineRecord.geocodeResult) {
      const matchedMappedAreas = mappedAreas.filter(
        (mappedArea) =>
          mappedArea.input === geocodePipelineRecord.samplePointGeoJSON,
      );
      for (const area of matchedMappedAreas) {
        const { areaSetCode, code } = area;
        if (areaSetCode && code) {
          geocodePipelineRecord.geocodeResult.areas[areaSetCode] = code;
        }
      }
    }
  });

  return geocodePipelineRecords;
};

const geocodeRecordsByAddress = async (
  dataRecords: MappingDataRecord[],
  geocodingConfig: AddressGeocodingConfig,
) => {
  const { columns: addressColumns } = geocodingConfig;
  const geocodePipelineRecords: GeocodePipelineRecord[] = dataRecords.map(
    (dataRecord) => {
      const dataRecordJson = dataRecord.json;

      for (const addressColumn of addressColumns) {
        if (!(addressColumn in dataRecordJson)) {
          return {
            externalId: dataRecord.externalId,
            error: `Missing address column "${addressColumn}" in row`,
          };
        }
      }

      const address = addressColumns
        .map((c) => dataRecordJson[c] || "")
        .filter(Boolean)
        .join(", ");
      if (!address) {
        return {
          externalId: dataRecord.externalId,
          error: `Missing address in row`,
        };
      }
      return { externalId: dataRecord.externalId, search: address };
    },
  );

  const recordsToTry = geocodePipelineRecords.filter((r) => r.search);
  const geocodeUrl = new URL("https://api.mapbox.com/search/geocode/v6/batch");
  geocodeUrl.searchParams.set(
    "access_token",
    process.env.MAPBOX_SECRET_TOKEN || "",
  );

  // No need to batch here as Mapbox supports up to 1000 items
  const response = await fetch(geocodeUrl, {
    method: "POST",
    // TODO: remove GB when other countries are supported
    body: JSON.stringify(
      recordsToTry.map((r) => ({
        types: ["address"],
        q: r.search,
        country: "GB",
        limit: 1,
      })),
    ),
  });
  if (!response.ok) {
    recordsToTry.forEach((r) => {
      r.error = `Geocode request failed: ${response.status}`;
    });
    return geocodePipelineRecords;
  }

  const results = (await response.json()) as {
    batch: { features?: { id: string; geometry: GeoJSONPoint }[] }[];
  };

  recordsToTry.forEach((record, i) => {
    const feature = results.batch[i]?.features?.[0];
    if (!feature) {
      record.error = `Geocode request returned no features for address ${record.search}`;
      return;
    }
    const point = {
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    };

    recordsToTry[i].samplePointGeoJSON = JSON.stringify({
      type: "Point",
      coordinates: [point.lng, point.lat],
    });
    recordsToTry[i].geocodeResult = {
      areas: {},
      centralPoint: point,
      samplePoint: point,
    };
  });

  const mappedAreas = await findAreasByPoints({
    points: recordsToTry
      .map((r) => r.samplePointGeoJSON)
      .filter((p) => p !== undefined),
  });

  recordsToTry.forEach((record) => {
    if (record.geocodeResult) {
      const matchedMappedAreas = mappedAreas.filter(
        (mappedArea) => mappedArea.input === record.samplePointGeoJSON,
      );
      for (const area of matchedMappedAreas) {
        const { areaSetCode, code } = area;
        if (areaSetCode && code) {
          record.geocodeResult.areas[areaSetCode] = code;
        }
      }
    }
  });

  return geocodePipelineRecords;
};

const geocodeRecordsByCoordinates = async (
  dataRecords: MappingDataRecord[],
  geocodingConfig: CoordinatesGeocodingConfig,
) => {
  const { latitudeColumn, longitudeColumn } = geocodingConfig;
  const geocodePipelineRecords: GeocodePipelineRecord[] = dataRecords.map(
    (dataRecord) => {
      const dataRecordJson = dataRecord.json;

      if (!(latitudeColumn in dataRecordJson)) {
        return {
          externalId: dataRecord.externalId,
          error: `Missing latitude column "${latitudeColumn}" in row`,
        };
      }
      if (!(longitudeColumn in dataRecordJson)) {
        return {
          externalId: dataRecord.externalId,
          error: `Missing latitude column "${longitudeColumn}" in row`,
        };
      }

      const lat = Number(dataRecordJson[latitudeColumn]);
      const lng = Number(dataRecordJson[longitudeColumn]);

      if (isNaN(lat) || isNaN(lng)) {
        return {
          externalId: dataRecord.externalId,
          error: `Invalid coordinates: latitude=${dataRecordJson[latitudeColumn]}, longitude=${dataRecordJson[longitudeColumn]}`,
        };
      }

      const point = { lng, lat };
      const search = JSON.stringify({
        type: "Point",
        coordinates: [lng, lat],
      });
      return {
        externalId: dataRecord.externalId,
        search,
        samplePointGeoJSON: search,
        geocodeResult: {
          areas: {},
          centralPoint: point,
          samplePoint: point,
        },
      };
    },
  );

  const mappedAreas = await findAreasByPoints({
    points: geocodePipelineRecords
      .map((r) => r.samplePointGeoJSON)
      .filter((p) => p !== undefined),
  });
  geocodePipelineRecords.forEach((record) => {
    if (record.geocodeResult) {
      const matchedMappedAreas = mappedAreas.filter(
        (mappedArea) => mappedArea.input === record.samplePointGeoJSON,
      );
      for (const area of matchedMappedAreas) {
        const { areaSetCode, code } = area;
        if (areaSetCode && code) {
          record.geocodeResult.areas[areaSetCode] = code;
        }
      }
    }
  });

  return geocodePipelineRecords;
};

const geojsonPointToPoint = (geojson: string): Point | null => {
  if (!geojson) {
    return null;
  }
  const [lng, lat] = (JSON.parse(geojson) as { coordinates: [number, number] })
    .coordinates;
  return { lng, lat };
};
