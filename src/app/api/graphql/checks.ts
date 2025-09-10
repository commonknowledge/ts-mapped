import z from "zod";
import {
  AreaSetCode,
  EnrichmentSourceType,
  GeocodingType,
  LooseEnrichment,
  LooseGeocodingConfig,
} from "@/__generated__/types";
import {
  AreaPropertyType,
  enrichmentSchema,
  geocodingConfigSchema,
} from "@/server/models/DataSource";

/**
 * This file is used for compile-type checking that GraphQL
 * and Zod types for objects are aligned. Is there a better way?
 *
 * To make sure a discriminated union has all necessary checks,
 * a Record that maps each possible discriminator value to a
 * sample object is used. TypeScript will error if any
 * valid discriminators are missing.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const enrichmentTypeChecks: Record<EnrichmentSourceType, LooseEnrichment> = {
  [EnrichmentSourceType.Area]: {
    sourceType: EnrichmentSourceType.Area,
    areaSetCode: AreaSetCode.MSOA21,
    areaProperty: AreaPropertyType.Code,
  } satisfies z.infer<typeof enrichmentSchema>,
  [EnrichmentSourceType.DataSource]: {
    sourceType: EnrichmentSourceType.DataSource,
    dataSourceId: "sampleId",
    dataSourceColumn: "sampleColumn",
  } satisfies z.infer<typeof enrichmentSchema>,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const geocodingTypeChecks: Record<GeocodingType, LooseGeocodingConfig> = {
  [GeocodingType.Address]: {
    type: GeocodingType.Address,
    columns: ["test"],
  } satisfies z.infer<typeof geocodingConfigSchema>,
  [GeocodingType.Code]: {
    type: GeocodingType.Code,
    column: "test",
    areaSetCode: AreaSetCode.MSOA21,
  } satisfies z.infer<typeof geocodingConfigSchema>,
  [GeocodingType.Name]: {
    type: GeocodingType.Code,
    column: "test",
    areaSetCode: AreaSetCode.MSOA21,
  } satisfies z.infer<typeof geocodingConfigSchema>,
  [GeocodingType.None]: {
    type: GeocodingType.None,
  },
};
