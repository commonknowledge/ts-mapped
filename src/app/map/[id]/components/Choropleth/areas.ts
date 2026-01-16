import { AreaSetGroupCode, AreaSetSizes } from "@/server/models/AreaSet";
import { CHOROPLETH_LAYER_CONFIGS } from "./configs";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { GeocodingConfig } from "@/server/models/DataSource";

// Return the area set groups that are valid as visualisation options
// for a given data source geocoding config
export const getValidAreaSetGroupCodes = (
  dataSourceGeocodingConfig: GeocodingConfig | null | undefined,
): AreaSetGroupCode[] => {
  if (!dataSourceGeocodingConfig) {
    return Object.values(AreaSetGroupCode);
  }

  const areaSetCode =
    "areaSetCode" in dataSourceGeocodingConfig
      ? dataSourceGeocodingConfig.areaSetCode
      : null;

  if (areaSetCode) {
    // Get a list of area sets that are smaller or equal in size
    // to the data source area set
    const dataSourceAreaSize = AreaSetSizes[areaSetCode];
    const validAreaSets = Object.keys(AreaSetSizes).filter(
      (code) => AreaSetSizes[code as AreaSetCode] >= dataSourceAreaSize,
    );

    // Get the associated group for each valid area set
    // Uses the above CHOROPLETH_LAYER_CONFIGS to match area set to group
    const validAreaGroups = new Set<AreaSetGroupCode>();
    for (const areaSetCode of validAreaSets) {
      for (const areaSetGroupCode of Object.keys(CHOROPLETH_LAYER_CONFIGS)) {
        const sources =
          CHOROPLETH_LAYER_CONFIGS[areaSetGroupCode as AreaSetGroupCode];
        if (sources.some((s) => s.areaSetCode === areaSetCode)) {
          validAreaGroups.add(areaSetGroupCode as AreaSetGroupCode);
        }
      }
    }
    return validAreaGroups.values().toArray();
  }

  // Default to all options
  return Object.values(AreaSetGroupCode);
};

// Return true if data might be aggregated when viewing stats for a data source using the provided boundaries
// E.G. If a data source is geocoded by WMC24, and the user is viewing the data using the WMC24 boundaries, this should return false
// However if the same data source is being viewed using the UKR18 boundaries, this should return true
export const dataRecordsWillAggregate = (
  dataSourceGeocodingConfig: GeocodingConfig | null | undefined,
  targetAreaSetGroupCode: AreaSetGroupCode | null | undefined,
) => {
  if (!dataSourceGeocodingConfig || !targetAreaSetGroupCode) {
    return false;
  }

  const areaSetCode =
    "areaSetCode" in dataSourceGeocodingConfig
      ? dataSourceGeocodingConfig.areaSetCode
      : null;

  // If data is not geocoded by area code, it will always be aggregated when getting area stats
  if (!areaSetCode) {
    return true;
  }

  const sourceAreaSize = AreaSetSizes[areaSetCode];

  // Return true if any of the area sets in the group are larger than the areas used to geocode the data source
  const targetAreaSetSizes = CHOROPLETH_LAYER_CONFIGS[
    targetAreaSetGroupCode
  ].map((c) => AreaSetSizes[c.areaSetCode]);
  return (
    targetAreaSetSizes.filter((targetSize) => targetSize > sourceAreaSize)
      .length > 0
  );
};
