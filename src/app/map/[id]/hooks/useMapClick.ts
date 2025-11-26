import { point as turfPoint } from "@turf/helpers";
import { booleanPointInPolygon } from "@turf/turf";
import { useContext, useEffect, useRef } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MARKER_DATA_SOURCE_ID_KEY, MARKER_ID_KEY } from "@/constants";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";
import type { MapMouseEvent } from "mapbox-gl";

export function useMapClick({
  draw,
  currentMode,
  markerLayers,
}: {
  draw: MapboxDraw | null;
  currentMode: string | null;
  markerLayers: string[];
}) {
  const { mapRef, pinDropMode } = useContext(MapContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const {
    resetInspector,
    setSelectedBoundary,
    selectedBoundary,
    setSelectedRecord,
    setSelectedTurf,
  } = useContext(InspectorContext);

  const {
    mapbox: { sourceId, layerId, featureCodeProperty, featureNameProperty },
    areaSetCode,
  } = choroplethLayerConfig;

  const activeFeatureId = useRef<string | undefined>(undefined);

  /* Handle clicks to set active state */
  useEffect(() => {
    if (!mapRef?.current) {
      return;
    }

    const map = mapRef.current;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;

    const onClick = (e: mapboxgl.MapMouseEvent) => {
      if (currentMode === "draw_polygon" || pinDropMode) {
        return;
      }

      if (handleMarkerClick(e)) {
        return;
      }

      if (handleTurfClick(e)) {
        return;
      }

      if (handleAreaClick(e)) {
        return;
      }

      resetInspector();
    };

    const handleMarkerClick = (e: mapboxgl.MapMouseEvent): boolean => {
      const validMarkerLayers = markerLayers.filter((l) => map.getLayer(l));
      const markerFeatures = map.queryRenderedFeatures(e.point, {
        layers: validMarkerLayers,
      });

      if (
        markerFeatures.length &&
        markerFeatures[0].geometry.type === "Point"
      ) {
        const properties = markerFeatures[0].properties;

        const dataRecordId = properties ? properties[MARKER_ID_KEY] : null;
        const dataSourceId = properties
          ? properties[MARKER_DATA_SOURCE_ID_KEY]
          : null;

        resetInspector();
        setSelectedRecord({
          id: dataRecordId,
          dataSourceId: dataSourceId,
          properties: properties,
        });

        map.flyTo({
          center: markerFeatures[0].geometry.coordinates as [number, number],
          zoom: 12,
        });

        return true;
      }

      return false;
    };

    const handleTurfClick = (e: mapboxgl.MapMouseEvent): boolean => {
      if (draw) {
        const polygonFeature = getClickedPolygonFeature(draw, e);

        if (polygonFeature) {
          draw.changeMode("simple_select", { featureIds: [] });
          resetInspector();
          setSelectedTurf({
            id: polygonFeature.properties?.id,
            name: polygonFeature.properties?.label,
            geometry: polygonFeature.geometry as Polygon,
          });

          return true;
        }
      }

      return false;
    };

    const handleAreaClick = (e: mapboxgl.MapMouseEvent): boolean => {
      if (!map.getLayer(fillLayerId) && !map.getLayer(lineLayerId)) {
        return false;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId, lineLayerId].filter((l) => map.getLayer(l)),
      });

      if (features.length > 0) {
        const feature = features[0];
        const areaCode = feature.properties?.[featureCodeProperty] as string;
        const areaName = feature.properties?.[featureNameProperty] as string;

        if (areaCode && areaName && feature.id !== undefined) {
          // Remove active state from previous feature
          if (activeFeatureId.current !== undefined) {
            map.setFeatureState(
              {
                source: sourceId,
                sourceLayer: layerId,
                id: activeFeatureId.current,
              },
              { active: false },
            );
          }

          // Use areaCode as the ID for feature state (matches promoteId)
          activeFeatureId.current = areaCode;
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: areaCode },
            { active: true },
          );

          resetInspector();
          setSelectedBoundary({
            id: feature?.id as string,
            areaCode: areaCode,
            areaSetCode: areaSetCode,
            sourceLayerId: feature?.sourceLayer as string,
            name: areaName,
            properties: feature?.properties || null,
          });

          return true;
        }
      }

      return false;
    };

    map.on("click", onClick);

    return () => {
      // Clean up active state on unmount
      if (activeFeatureId.current !== undefined) {
        try {
          map?.setFeatureState(
            {
              source: sourceId,
              sourceLayer: layerId,
              id: activeFeatureId.current,
            },
            { active: false },
          );
        } catch {
          // Ignore error clearing feature state
        }
      }

      map.off("click", onClick);
    };
  }, [
    mapRef,
    sourceId,
    layerId,
    featureCodeProperty,
    featureNameProperty,
    areaSetCode,
    resetInspector,
    setSelectedBoundary,
    markerLayers,
    setSelectedRecord,
    draw,
    currentMode,
    pinDropMode,
    setSelectedTurf,
  ]);

  // Clear active feature state when selectedBoundary is cleared (resetInspector called from outside)
  useEffect(() => {
    if (
      selectedBoundary === null &&
      mapRef?.current &&
      activeFeatureId.current !== undefined
    ) {
      const map = mapRef.current;
      map.setFeatureState(
        {
          source: sourceId,
          sourceLayer: layerId,
          id: activeFeatureId.current,
        },
        { active: false },
      );
      activeFeatureId.current = undefined;
    }
  }, [selectedBoundary, mapRef, sourceId, layerId]);
}

export const getClickedPolygonFeature = (
  draw: MapboxDraw,
  e: MapMouseEvent,
): Feature<Polygon | MultiPolygon> | null => {
  const drawData: FeatureCollection = draw.getAll();

  if (drawData.features.length === 0) return null;

  const point: Feature<Point> = turfPoint([e.lngLat.lng, e.lngLat.lat]);

  // Type guard — no `any` or unsafe casts
  const isPolygonFeature = (
    f: unknown,
  ): f is Feature<Polygon | MultiPolygon> => {
    if (typeof f !== "object" || f === null) return false;

    if (!("geometry" in f)) return false;

    const geometry = (f as { geometry?: Geometry }).geometry;
    if (!geometry) return false;

    return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
  };

  const polygonFeature = drawData.features.find(
    (feature: Feature): feature is Feature<Polygon | MultiPolygon> =>
      isPolygonFeature(feature) && booleanPointInPolygon(point, feature),
  );

  return polygonFeature ?? null;
};
