import {
  CHOROPLETH_AREA_SET_CODES,
  getSecondaryAreaSetConfig,
} from "./configs";
import type { AreaSetCode } from "@/models/AreaSet";
import type { PointLike } from "mapbox-gl";
import type { MapRef } from "react-map-gl/mapbox";

export const listsOnlySourceId = (areaSetCode: AreaSetCode) =>
  `lists-only-${areaSetCode}`;

export const listsOnlyFillLayerId = (areaSetCode: AreaSetCode) =>
  `${listsOnlySourceId(areaSetCode)}-fill`;

/** The list area under a point when the map shows lists only */
export const queryListsOnlyArea = ({
  map,
  point,
}: {
  map: MapRef;
  point: PointLike;
}) => {
  const layers = CHOROPLETH_AREA_SET_CODES.filter((areaSetCode) =>
    map.getLayer(listsOnlyFillLayerId(areaSetCode)),
  );
  if (!layers.length) return null;
  const [feature] = map.queryRenderedFeatures(point, {
    layers: layers.map(listsOnlyFillLayerId),
  });
  const areaSetCode = layers.find(
    (code) => feature?.layer?.id === listsOnlyFillLayerId(code),
  );
  const config = areaSetCode
    ? getSecondaryAreaSetConfig({ areaSetCode, mapType: null })
    : null;
  if (!feature || !areaSetCode || !config) return null;
  const code = String(feature.properties?.[config.mapbox.featureCodeProperty]);
  return {
    feature,
    areaSetCode,
    code,
    name: String(
      feature.properties?.[config.mapbox.featureNameProperty] ?? code,
    ),
    source: listsOnlySourceId(areaSetCode),
    sourceLayer: config.mapbox.layerId,
  };
};
