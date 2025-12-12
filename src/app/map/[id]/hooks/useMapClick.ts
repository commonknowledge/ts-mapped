import { point as turfPoint } from "@turf/helpers";
import { booleanPointInPolygon } from "@turf/turf";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { compareAreasAtom } from "@/app/map/[id]/atoms/mapStateAtoms";
import {
  type SelectedArea,
  selectedAreasAtom,
} from "@/app/map/[id]/atoms/selectedAreasAtom";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { usePinDropMode } from "./useMapControls";
import { useMapRef } from "./useMapCore";
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

export function useMapClickEffect({
  draw,
  currentMode,
  markerLayers,
  ready,
}: {
  draw: MapboxDraw | null;
  currentMode: string | null;
  markerLayers: string[];
  ready: boolean;
}) {
  const mapRef = useMapRef();
  const pinDropMode = usePinDropMode();
  const { choroplethLayerConfig } = useChoropleth();
  const {
    resetInspector,
    setSelectedBoundary,
    selectedBoundary,
    setSelectedRecords,
    setSelectedTurf,
  } = useInspector();
  const [selectedAreas, setSelectedAreas] = useAtom(selectedAreasAtom);
  const compareAreasMode = useAtomValue(compareAreasAtom);

  const {
    mapbox: { sourceId, layerId, featureCodeProperty, featureNameProperty },
    areaSetCode,
  } = choroplethLayerConfig;

  const activeFeatureId = useRef<string | undefined>(undefined);
  const selectedAreasRef = useRef(selectedAreas);
  const prevSelectedAreasRef = useRef<SelectedArea[]>([]);

  // Keep ref in sync with latest selectedAreas
  useEffect(() => {
    selectedAreasRef.current = selectedAreas;
  }, [selectedAreas]);

  // Update feature states for selected areas
  useEffect(() => {
    if (!mapRef?.current || !ready) {
      return;
    }

    const map = mapRef.current;
    const prevSelectedAreas = prevSelectedAreasRef.current;

    // Update previous selected areas before processing to ensure it's always set
    prevSelectedAreasRef.current = selectedAreas;

    // Find areas that were removed from selection
    const removedAreas = prevSelectedAreas.filter(
      (prevArea) =>
        !selectedAreas.some(
          (area) =>
            area.code === prevArea.code &&
            area.areaSetCode === prevArea.areaSetCode,
        ),
    );

    // Remove selected state from removed areas
    removedAreas.forEach((area) => {
      if (area.areaSetCode === areaSetCode) {
        try {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: area.code },
            { selected: false },
          );
        } catch {
          // Ignore errors
        }
      }
    });

    // Set selected state for all currently selected areas
    selectedAreas.forEach((area) => {
      if (area.areaSetCode === areaSetCode) {
        try {
          map.setFeatureState(
            { source: sourceId, sourceLayer: layerId, id: area.code },
            { selected: true },
          );
        } catch {
          // Ignore errors
        }
      }
    });
  }, [selectedAreas, mapRef, ready, sourceId, layerId, areaSetCode]);

  /* Handle clicks to set active state */
  useEffect(() => {
    if (!mapRef?.current || !ready) {
      return;
    }

    const map = mapRef.current;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;

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

        if (properties?.cluster) {
          const ids = properties ? properties.ids : "";
          const records = [];
          for (const idAndDataSource of ids.split(",").filter(Boolean)) {
            const [id, dataSourceId, name] = idAndDataSource.split(":");
            records.push({
              id,
              dataSourceId,
              name,
              geocodePoint: {
                lng: markerFeatures[0].geometry.coordinates[0],
                lat: markerFeatures[0].geometry.coordinates[1],
              },
            });
          }

          resetInspector();
          setSelectedRecords(records);

          map.flyTo({
            center: markerFeatures[0].geometry.coordinates as [number, number],
            zoom: map.getZoom() + 1,
          });
        } else {
          resetInspector();
          if (markerFeatures[0].properties) {
            setSelectedRecords([
              {
                id: markerFeatures[0].properties.id,
                dataSourceId: markerFeatures[0].properties.dataSourceId || "",
                name: markerFeatures[0].properties.name,
                geocodePoint: {
                  lng: markerFeatures[0].geometry.coordinates[0],
                  lat: markerFeatures[0].geometry.coordinates[1],
                },
              },
            ]);
          }

          map.flyTo({
            center: markerFeatures[0].geometry.coordinates as [number, number],
            zoom: Math.max(12, map.getZoom()),
          });
        }

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
          // Check if clicking the same active area
          if (activeFeatureId.current === areaCode) {
            // Deactivate the current area
            map.setFeatureState(
              {
                source: sourceId,
                sourceLayer: layerId,
                id: activeFeatureId.current,
              },
              { active: false },
            );
            activeFeatureId.current = undefined;
            resetInspector();
            return true;
          }

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

    const handleCtrlAreaClick = (e: mapboxgl.MapMouseEvent): boolean => {
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

        if (areaCode && areaName) {
          // Use ref to get the latest selectedAreas value
          const currentSelectedAreas = selectedAreasRef.current;

          // Check if area already exists in selection
          const existingIndex = currentSelectedAreas.findIndex(
            (a) => a.code === areaCode && a.areaSetCode === areaSetCode,
          );

          if (existingIndex !== -1) {
            // Remove area from selection
            const newSelectedAreas = currentSelectedAreas.filter(
              (_, index) => index !== existingIndex,
            );
            setSelectedAreas(newSelectedAreas);
            return true;
          } else {
            // Add area to selected areas
            const newArea = {
              areaSetCode,
              code: areaCode,
              name: areaName,
              coordinates: [e.lngLat.lng, e.lngLat.lat] as [number, number],
            };
            setSelectedAreas([...currentSelectedAreas, newArea]);
            return true;
          }
        }
      }

      return false;
    };

    const onClick = (e: mapboxgl.MapMouseEvent) => {
      if (currentMode === "draw_polygon" || pinDropMode) {
        return;
      }

      // Check if compare areas mode is active
      if (compareAreasMode) {
        if (handleCtrlAreaClick(e)) {
          return;
        }
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
    draw,
    currentMode,
    pinDropMode,
    setSelectedTurf,
    ready,
    setSelectedRecords,
    setSelectedAreas,
    compareAreasMode,
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

    if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
      return false;
    }

    // Ignore weird initial polygon when beginning to draw a turf
    return !geometry.coordinates.some((c) => c.length === 1 && c[0] === null);
  };

  const polygonFeature = drawData.features.find(
    (feature: Feature): feature is Feature<Polygon | MultiPolygon> =>
      isPolygonFeature(feature) && booleanPointInPolygon(point, feature),
  );

  return polygonFeature ?? null;
};
