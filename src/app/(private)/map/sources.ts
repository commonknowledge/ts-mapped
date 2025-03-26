// TODO: share this with the backend?
enum AreaSetCode {
  WMC24 = "WMC24",
  OA21 = "OA21",
  MSOA21 = "MSOA21",
}

export const AREA_SET_GROUP_LABELS = {
  WMC24: "Westminster Constituencies 2024",
  OA21: "Census Output Areas 2021",
};

export type AreaSetGroupCode = keyof typeof AREA_SET_GROUP_LABELS;

const MAX_VALID_ZOOM = 24;

interface MapSource {
  areaSetCode: AreaSetCode;
  codeProperty: string;
  nameProperty: string;
  mapboxSourceId: string;
  mapboxLayerId: string;
  minZoom: number;
  maxZoom: number;
}

// MapSources within a group should be in ascending order of minZoom
const MAP_SOURCES: Record<AreaSetGroupCode, MapSource[]> = {
  WMC24: [
    {
      areaSetCode: AreaSetCode.WMC24,
      codeProperty: "gss_code",
      nameProperty: "name",
      mapboxSourceId: "commonknowledge.bhg1h3hj",
      mapboxLayerId: "uk_cons_2025",
      minZoom: 0,
      maxZoom: MAX_VALID_ZOOM,
    },
  ],
  OA21: [
    {
      areaSetCode: AreaSetCode.MSOA21,
      codeProperty: "MSOA21CD",
      nameProperty: "MSOA21NM",
      mapboxSourceId: "commonknowledge.bjml5p4d",
      mapboxLayerId:
        "Middle_layer_Super_Output_Areas_December_2021_Boundaries_EW_BGC",
      minZoom: 2,
      maxZoom: 10,
    },
    {
      areaSetCode: AreaSetCode.OA21,
      codeProperty: "OA21CD",
      nameProperty: "OA21CD",
      mapboxSourceId: "commonknowledge.3pgj1hgo",
      mapboxLayerId: "output_areas_latlng-8qk00p",
      minZoom: 10,
      maxZoom: MAX_VALID_ZOOM,
    },
  ],
};

export const MAPBOX_SOURCE_IDS = Object.values(MAP_SOURCES).flatMap((sources) =>
  sources.map((source) => source.mapboxSourceId)
);

export const getMapSource = (
  areaSetGroupCode: AreaSetGroupCode,
  zoom: number
) => {
  const sources = MAP_SOURCES[areaSetGroupCode] || [];
  for (const source of sources) {
    if (source.minZoom <= zoom && source.maxZoom > zoom) {
      return source;
    }
  }
  return MAP_SOURCES["WMC24"][0];
};
