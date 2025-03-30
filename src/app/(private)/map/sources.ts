import { AreaSetCode } from "@/types";

export const AREA_SET_GROUP_LABELS = {
  WMC24: "Westminster Constituencies 2024",
  OA21: "Census Output Areas 2021",
};

export type AreaSetGroupCode = keyof typeof AREA_SET_GROUP_LABELS;

const MAX_VALID_ZOOM = 24;

export interface ChoroplethLayerConfig {
  areaSetCode: AreaSetCode;
  minZoom: number;
  maxZoom: number;
  requiresBoundingBox: boolean;
  mapbox: {
    featureCodeProperty: string;
    featureNameProperty: string;
    layerId: string;
    sourceId: string;
  };
}

// Configs within a group should be in ascending order of minZoom
const CHOROPLETH_LAYER_CONFIGS: Record<
  AreaSetGroupCode,
  ChoroplethLayerConfig[]
> = {
  WMC24: [
    {
      areaSetCode: AreaSetCode.WMC24,
      minZoom: 0,
      maxZoom: MAX_VALID_ZOOM,
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
      areaSetCode: AreaSetCode.MSOA21,
      minZoom: 2,
      maxZoom: 10,
      requiresBoundingBox: false,
      mapbox: {
        featureCodeProperty: "MSOA21CD",
        featureNameProperty: "MSOA21NM",
        layerId:
          "Middle_layer_Super_Output_Areas_December_2021_Boundaries_EW_BGC",
        sourceId: "commonknowledge.bjml5p4d",
      },
    },
    {
      areaSetCode: AreaSetCode.OA21,
      minZoom: 10,
      maxZoom: MAX_VALID_ZOOM,
      requiresBoundingBox: true,
      mapbox: {
        featureCodeProperty: "OA21CD",
        featureNameProperty: "OA21CD",
        layerId: "output_areas_latlng-8qk00p",
        sourceId: "commonknowledge.3pgj1hgo",
      },
    },
  ],
};

export const MAPBOX_SOURCE_IDS = Object.values(
  CHOROPLETH_LAYER_CONFIGS,
).flatMap((sources) => sources.map((source) => source.mapbox.sourceId));

export const getChoroplethLayerConfig = (
  areaSetGroupCode: AreaSetGroupCode,
  zoom: number,
) => {
  const sources = CHOROPLETH_LAYER_CONFIGS[areaSetGroupCode] || [];
  for (const source of sources) {
    if (source.minZoom <= zoom && source.maxZoom > zoom) {
      return source;
    }
  }
  // Return a default to simplify code
  return CHOROPLETH_LAYER_CONFIGS["WMC24"][0];
};
