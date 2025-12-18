import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { hoverAreaAtom, hoverMarkerAtom } from "../atoms/hoverAtoms";
import { getClickedPolygonFeature } from "./useMapClick";
import {
  useCompareGeographiesModeAtom,
  useEditAreaMode,
  usePinDropMode,
} from "./useMapControls";
import { useMapRef } from "./useMapCore";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";

export function useMapHoverEffect({
  markerLayers,
  draw,
  ready,
}: {
  markerLayers: string[];
  draw: MapboxDraw | null;
  ready: boolean;
}) {
  const mapRef = useMapRef();
  const { choroplethLayerConfig } = useChoropleth();
  const {
    areaSetCode,
    mapbox: { sourceId, layerId, featureNameProperty },
  } = choroplethLayerConfig;

  const [, setHoverArea] = useHoverArea();
  const [, setHoverMarker] = useHoverMarker();
  const [compareGeographiesMode, setCompareGeographiesMode] =
    useCompareGeographiesModeAtom();
  const pinDropMode = usePinDropMode();
  const editAreaMode = useEditAreaMode();

  // Use refs to avoid recreating event listeners when modes change
  const compareGeographiesModeRef = useRef(compareGeographiesMode);
  const pinDropModeRef = useRef(pinDropMode);
  const editAreaModeRef = useRef(editAreaMode);

  useEffect(() => {
    compareGeographiesModeRef.current = compareGeographiesMode;
    pinDropModeRef.current = pinDropMode;
    editAreaModeRef.current = editAreaMode;
  }, [compareGeographiesMode, pinDropMode, editAreaMode]);

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

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "c" || e.key === "C") && !e.repeat) {
        setCompareGeographiesMode(true);
        const canvas = map.getCanvas();
        if (canvas.style.cursor === "pointer") {
          canvas.style.cursor = "copy";
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") {
        setCompareGeographiesMode(false);
        const canvas = map.getCanvas();
        if (canvas.style.cursor === "copy") {
          canvas.style.cursor = "pointer";
        }
      }
    };

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (pinDropModeRef.current || editAreaModeRef.current) {
        // In draw/pin modes, ignore hover effects and keep crosshair
        map.getCanvas().style.cursor = "crosshair";
        clearAreaHover();
        setHoverMarker(null);
        return;
      }

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

      // Clear area hover if mouse is not over any feature
      clearAreaHover();
    };

    const onMouseLeave = () => {
      clearAreaHover();
      setHoverMarker(null);
      if (pinDropModeRef.current || editAreaModeRef.current) {
        map.getCanvas().style.cursor = "crosshair";
      } else {
        map.getCanvas().style.cursor = prevPointer.cursor;
      }
    };

    // Reset cursor when exiting pin/edit modes
    if (!(pinDropModeRef.current || editAreaModeRef.current)) {
      map.getCanvas().style.cursor = prevPointer.cursor;
    }

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

        if (feature.id !== undefined) {
          // Only update if the feature has changed to reduce unnecessary state updates
          if (hoveredFeatureId !== feature.id) {
            // Remove hover state from previous feature
            if (hoveredFeatureId !== undefined) {
              map.setFeatureState(
                { source: sourceId, sourceLayer: layerId, id: hoveredFeatureId },
                { hover: false },
              );
            }

            // Set hover state on new feature
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
        }

        if (
          map.getCanvas().style.cursor !== "pointer" &&
          map.getCanvas().style.cursor !== "copy"
        ) {
          prevPointer.cursor = map.getCanvas().style.cursor || "";
        }
        map.getCanvas().style.cursor = compareGeographiesModeRef.current
          ? "copy"
          : "pointer";
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

      if (
        map.getCanvas().style.cursor === "pointer" ||
        map.getCanvas().style.cursor === "copy"
      ) {
        map.getCanvas().style.cursor = prevPointer.cursor;
      }

      return false;
    };

    map.on("mousemove", onMouseMove);
    map.on("mouseleave", onMouseLeave);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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
      map.off("mouseout", onMouseLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
    setCompareGeographiesMode,
  ]);
}

export function useHoverArea() {
  return useAtom(hoverAreaAtom);
}

export function useHoverMarker() {
  return useAtom(hoverMarkerAtom);
}
