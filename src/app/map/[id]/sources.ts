import { AreaSetCode } from "@/server/models/AreaSet";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";

export interface ChoroplethLayerConfig {
  areaSetCode: AreaSetCode;
  minZoom: number;
  requiresBoundingBox: boolean;
  mapbox: {
    featureCodeProperty: string;
    featureNameProperty: string;
    layerId: string;
    sourceId: string;
  };
}

const AREA_SET_SIZES: Record<AreaSetCode, number> = {
  [AreaSetCode.PC]: 1,
  [AreaSetCode.OA21]: 1,
  [AreaSetCode.MSOA21]: 2,
  [AreaSetCode.WMC24]: 4,
  [AreaSetCode.UKR18]: 6,
};

// Configs within a group should be in descending order of minZoom
export const CHOROPLETH_LAYER_CONFIGS: Record<
  AreaSetGroupCode,
  ChoroplethLayerConfig[]
> = {
  UKR18: [
    {
      areaSetCode: AreaSetCode.UKR18,
      minZoom: 0,
      requiresBoundingBox: false,
      mapbox: {
        featureCodeProperty: "eer18cd",
        featureNameProperty: "eer18nm",
        layerId: "regions-29o2db",
        sourceId: "commonknowledge.dlbkjy9x",
      },
    },
  ],
  WMC24: [
    {
      areaSetCode: AreaSetCode.WMC24,
      minZoom: 0,
      requiresBoundingBox: false,
      mapbox: {
        featureCodeProperty: "gss_code",
        featureNameProperty: "name",
        layerId: "uk_cons_2025",
        sourceId: "commonknowledge.bhg1h3hj",
      },
    },
  ],
  OA21: [
    {
      areaSetCode: AreaSetCode.OA21,
      minZoom: 10,
      requiresBoundingBox: true,
      mapbox: {
        featureCodeProperty: "OA21CD",
        featureNameProperty: "OA21CD",
        layerId: "output_areas_latlng-8qk00p",
        sourceId: "commonknowledge.3pgj1hgo",
      },
    },
    {
      areaSetCode: AreaSetCode.MSOA21,
      minZoom: 2,
      requiresBoundingBox: false,
      mapbox: {
        featureCodeProperty: "MSOA21CD",
        featureNameProperty: "MSOA21NM",
        layerId:
          "Middle_layer_Super_Output_Areas_December_2021_Boundaries_EW_BGC",
        sourceId: "commonknowledge.bjml5p4d",
      },
    },
  ],
};

export const MAPBOX_SOURCE_IDS = Object.values(
  CHOROPLETH_LAYER_CONFIGS,
).flatMap((sources) => sources.map((source) => source.mapbox.sourceId));

export const getChoroplethLayerConfig = (
  dataSourceAreaSetCode: AreaSetCode | null | undefined,
  areaSetGroupCode: AreaSetGroupCode | null | undefined,
  zoom: number,
) => {
  if (areaSetGroupCode) {
    const sources = CHOROPLETH_LAYER_CONFIGS[areaSetGroupCode] || [];
    for (const source of sources) {
      if (source.minZoom <= zoom) {
        if (!dataSourceAreaSetCode) {
          return source;
        }
        // If the data source is configured for an area set, don't show smaller shapes than that
        // (to avoid displaying gaps on the map)
        if (
          AREA_SET_SIZES[dataSourceAreaSetCode] <=
          AREA_SET_SIZES[source.areaSetCode]
        ) {
          return source;
        }
      }
    }
  }
  return CHOROPLETH_LAYER_CONFIGS["WMC24"][0];
};
