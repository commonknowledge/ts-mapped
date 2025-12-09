import { useContext, useEffect } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { getClickedPolygonFeature } from "./useMapClick";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";

export function useMapHover({
  markerLayers,
  setHoverMarker,
  setHoverArea,
  draw,
  ready,
}: {
  markerLayers: string[];
  setHoverMarker: (
    m: {
      coordinates: [number, number];
      properties: Record<string, unknown>;
    } | null,
  ) => void;
  setHoverArea: (
    a: {
      areaSetCode: AreaSetCode;
      code: string;
      name: string;
      coordinates: [number, number];
    } | null,
  ) => void;
  draw: MapboxDraw | null;
  ready: boolean;
}) {
  const { mapRef } = useContext(MapContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const {
    areaSetCode,
    mapbox: { sourceId, layerId, featureNameProperty },
  } = choroplethLayerConfig;

  /* Set cursor to pointer and darken fill on hover over choropleth areas */
  useEffect(() => {
    if (!mapRef?.current || !ready) {
      return;
    }

    const map = mapRef.current;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;
    const prevPointer = { cursor: "" };
    let hoveredFeatureId: string | number | undefined;

    const clearAreaHover = () => {
      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
        setHoverArea(null);
        hoveredFeatureId = undefined;
      }
    };

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (handleHoverMarker(e)) {
        clearAreaHover();
        return;
      }

      if (handleHoverTurf(e)) {
        clearAreaHover();
        return;
      }

      if (handleHoverArea(e)) {
        return;
      }
    };

    const onMouseLeave = () => {
      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
        hoveredFeatureId = undefined;
      }
      map.getCanvas().style.cursor = prevPointer.cursor;
    };

    const handleHoverMarker = (e: mapboxgl.MapMouseEvent): boolean => {
      const map = mapRef?.current;

      if (!map) {
        return false;
      }

      const features = map.queryRenderedFeatures(e.point, {
        // Filter out layers that aren't ready
        layers: markerLayers.filter((layer) => map.getLayer(layer)),
      });

      if (features?.length) {
        const feature = features[0];
        setHoverMarker({
          coordinates: [e.lngLat.lng, e.lngLat.lat],
          properties: feature.properties || {},
        });
        if (map.getCanvas().style.cursor !== "pointer") {
          prevPointer.cursor = map.getCanvas().style.cursor || "";
        }
        map.getCanvas().style.cursor = "pointer";
        return true;
      }

      setHoverMarker(null);
      if (map.getCanvas().style.cursor === "pointer") {
        map.getCanvas().style.cursor = prevPointer.cursor;
      }
      return false;
    };

    const handleHoverTurf = (e: mapboxgl.MapMouseEvent): boolean => {
      if (draw) {
        const polygonFeature = getClickedPolygonFeature(draw, e);
        if (polygonFeature) {
          return true;
        }
      }
      return false;
    };

    const handleHoverArea = (e: mapboxgl.MapMouseEvent): boolean => {
      if (!map.getLayer(fillLayerId) && !map.getLayer(lineLayerId)) {
        return false;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId, lineLayerId].filter((l) => map.getLayer(l)),
      });

      if (features?.length) {
        const feature = features[0];

        // Remove hover state from previous
        if (hoveredFeatureId !== undefined) {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: false },
          );
        }

        if (feature.id !== undefined) {
          // Set hover state on current feature
          hoveredFeatureId = feature.id;
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: true },
          );
          setHoverArea({
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            areaSetCode,
            code: String(feature.id),
            name: String(
              feature.properties?.[featureNameProperty] || feature.id,
            ),
          });
        }

        if (map.getCanvas().style.cursor !== "pointer") {
          prevPointer.cursor = map.getCanvas().style.cursor || "";
        }
        map.getCanvas().style.cursor = "pointer";
        return true;
      }

      if (hoveredFeatureId !== undefined) {
        map.setFeatureState(
          { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
          { hover: false },
        );
        hoveredFeatureId = undefined;
        setHoverArea(null);
      }

      if (map.getCanvas().style.cursor === "pointer") {
        map.getCanvas().style.cursor = prevPointer.cursor;
      }

      return false;
    };

    map.on("mousemove", onMouseMove);
    map.on("mouseleave", onMouseLeave);

    return () => {
      // Clean up hover state on unmount
      if (hoveredFeatureId !== undefined) {
        try {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
            { hover: false },
          );
        } catch {
          // Ignore error clearing feature state
        }
      }

      map.off("mousemove", onMouseMove);
      map.off("mouseleave", onMouseLeave);
    };
  }, [
    mapRef,
    sourceId,
    layerId,
    markerLayers,
    setHoverMarker,
    draw,
    ready,
    setHoverArea,
    featureNameProperty,
    areaSetCode,
  ]);
}
