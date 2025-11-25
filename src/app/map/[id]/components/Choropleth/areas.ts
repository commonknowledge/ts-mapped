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
    return [];
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
