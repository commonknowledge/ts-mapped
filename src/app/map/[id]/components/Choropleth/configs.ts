import { AreaSetCode, AreaSetSizes } from "@/server/models/AreaSet";
import { MapType } from "@/server/models/MapView";
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

// Configs within a group should be in descending order of minZoom
export const CHOROPLETH_LAYER_CONFIGS: Record<
  AreaSetGroupCode,
  ChoroplethLayerConfig[]
> = {
  UKC24: [
    {
      areaSetCode: AreaSetCode.UKC24,
      minZoom: 0,
      requiresBoundingBox: false,
      mapbox: {
        featureCodeProperty: "CTRY24CD",
        featureNameProperty: "CTRY24NM",
        layerId: "countries",
        sourceId: "commonknowledge.4rj0pr4g",
      },
    },
  ],
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
  W25: [
    {
      areaSetCode: AreaSetCode.W25,
      minZoom: 6,
      requiresBoundingBox: true,
      mapbox: {
        featureCodeProperty: "WD25CD",
        featureNameProperty: "WD25NM",
        layerId: "wards",
        sourceId: "commonknowledge.9cnmf4m1",
      },
    },
    {
      areaSetCode: AreaSetCode.LAD25,
      minZoom: 2,
      requiresBoundingBox: false,
      mapbox: {
        featureCodeProperty: "LAD25CD",
        featureNameProperty: "LAD25NM",
        layerId: "lads",
        sourceId: "commonknowledge.3nsunzct",
      },
    },
  ],
  LAD25: [
    {
      areaSetCode: AreaSetCode.LAD25,
      minZoom: 2,
      requiresBoundingBox: false,
      mapbox: {
        featureCodeProperty: "LAD25CD",
        featureNameProperty: "LAD25NM",
        layerId: "lads",
        sourceId: "commonknowledge.3nsunzct",
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

export const HEX_CHOROPLETH_LAYER_CONFIG: ChoroplethLayerConfig = {
  areaSetCode: AreaSetCode.WMC24,
  minZoom: 0,
  requiresBoundingBox: false,
  mapbox: {
    featureCodeProperty: "id",
    featureNameProperty: "n",
    layerId: "output-6invyt",
    sourceId: "commonknowledge.7a97ep7k",
  },
};

export const MAPBOX_SOURCE_IDS = Object.values(CHOROPLETH_LAYER_CONFIGS)
  .flatMap((sources) => sources.map((source) => source.mapbox.sourceId))
  .concat([HEX_CHOROPLETH_LAYER_CONFIG.mapbox.sourceId]);

export const getChoroplethLayerConfig = ({
  dataSourceAreaSetCode,
  areaSetGroupCode,
  mapType,
  zoom,
}: {
  dataSourceAreaSetCode?: AreaSetCode | null;
  areaSetGroupCode?: AreaSetGroupCode | null;
  mapType?: MapType | null;
  zoom: number;
}) => {
  if (mapType === MapType.Hex) {
    return HEX_CHOROPLETH_LAYER_CONFIG;
  }
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
          AreaSetSizes[dataSourceAreaSetCode] <=
          AreaSetSizes[source.areaSetCode]
        ) {
          return source;
        }
      }
    }
  }
  return CHOROPLETH_LAYER_CONFIGS["WMC24"][0];
};
