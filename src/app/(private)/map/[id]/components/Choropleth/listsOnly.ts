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

// Quick add draws its list's boundary set on its own source
export const quickAddSourceId = (areaSetCode: AreaSetCode) =>
  `quick-add-${areaSetCode}`;

export const quickAddFillLayerId = (areaSetCode: AreaSetCode) =>
  `${quickAddSourceId(areaSetCode)}-fill`;

/** The area under a point on the quick-add layer for a boundary set */
export const queryQuickAddArea = ({
  map,
  point,
  areaSetCode,
}: {
  map: MapRef;
  point: PointLike;
  areaSetCode: AreaSetCode;
}) => {
  const layerId = quickAddFillLayerId(areaSetCode);
  const config = getSecondaryAreaSetConfig({ areaSetCode, mapType: null });
  if (!config || !map.getLayer(layerId)) return null;
  const [feature] = map.queryRenderedFeatures(point, { layers: [layerId] });
  if (!feature) return null;
  const code = String(feature.properties?.[config.mapbox.featureCodeProperty]);
  return {
    code,
    name: String(
      feature.properties?.[config.mapbox.featureNameProperty] ?? code,
    ),
  };
};
