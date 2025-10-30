import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";
import * as turf from "@turf/turf";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Popup } from "react-map-gl/mapbox";
import { v4 as uuidv4 } from "uuid";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { useTurfsQuery } from "@/app/map/[id]/hooks/useTurfs";
import {
  getDataSourceIds,
  getMapStyle,
} from "@/app/map/[id]/stores/useMapStore";
import { useMapStore } from "@/app/map/[id]/stores/useMapStore";
import {
  DEFAULT_ZOOM,
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_ID_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import { AreaSetCode } from "@/server/models/AreaSet";
import { useTurfMutations } from "../hooks/useTurfs";
import { MAPBOX_SOURCE_IDS } from "../sources";
import { CONTROL_PANEL_WIDTH, mapColors } from "../styles";
import Choropleth from "./Choropleth";
import FilterMarkers from "./FilterMarkers";

import MapWrapper from "./MapWrapper";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
import SearchResultMarker from "./SearchResultMarker";
import type { Polygon } from "@/server/models/Turf";
import type { DrawDeleteEvent, DrawModeChangeEvent } from "@/types";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Point,
} from "geojson";
import type { MapMouseEvent } from "mapbox-gl";
import type { MapRef } from "react-map-gl/mapbox";

export default function Map({
  onSourceLoad,
  hideDrawControls,
}: {
  onSourceLoad: (sourceId: string) => void;
  hideDrawControls?: boolean;
}) {
  const setBoundingBox = useMapStore((s) => s.setBoundingBox);
  const setZoom = useMapStore((s) => s.setZoom);
  const privatePinDropMode = useMapStore((s) => s.pinDropMode);
  const pinDropMode = hideDrawControls ? false : privatePinDropMode;
  const showControls = useMapStore((s) => s.showControls);
  const ready = useMapStore((s) => s.ready);
  const setReady = useMapStore((s) => s.setReady);
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { data: turfs = [] } = useTurfsQuery();
  const searchMarker = useMapStore((s) => s.searchMarker);
  const turfVisibility = useMapStore((s) => s.turfVisibility);
  const markerQueries = useMarkerQueries();

  const visibleTurfs = useMemo(() => {
    return turfs.filter((turf) => turfVisibility[turf.id] !== false);
  }, [turfs, turfVisibility]);
  const resetInspector = useMapStore((s) => s.resetInspector);
  const setSelectedRecord = useMapStore((s) => s.setSelectedRecord);
  const setSelectedTurf = useMapStore((s) => s.setSelectedTurf);
  const setSelectedBoundary = useMapStore((s) => s.setSelectedBoundary);
  const choroplethLayerConfig = useMapStore((s) => s.choroplethLayerConfig);
  const setMapRef = useMapStore((s) => s.setMapRef);

  // Create a local ref for React - this will be synced to Zustand
  const localMapRef = useRef<MapRef>(null);

  const areaSetCode = choroplethLayerConfig?.areaSetCode;
  const sourceId = choroplethLayerConfig?.mapbox.sourceId;
  const layerId = choroplethLayerConfig?.mapbox.layerId;
  const featureNameProperty = choroplethLayerConfig?.mapbox.featureNameProperty;
  const featureCodeProperty = choroplethLayerConfig?.mapbox.featureCodeProperty;

  const [styleLoaded, setStyleLoaded] = useState(false);

  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const [hoverMarker, setHoverMarker] = useState<{
    coordinates: [number, number];
    properties: Record<string, unknown>;
  } | null>(null);
  const [currentMode, setCurrentMode] = useState<string | null>("");
  const prevPointer = useRef("");
  const [didInitialFit, setDidInitialFit] = useState(false);

  const markerLayers = useMemo(
    () =>
      getDataSourceIds(mapConfig)
        .flatMap((id: string) => [`${id}-markers-pins`, `${id}-markers-labels`])
        .concat(["search-history-pins", "search-history-labels"]),
    [mapConfig],
  );

  const { insertTurf, updateTurf, deleteTurf } = useTurfMutations();

  // draw existing turfs
  useEffect(() => {
    if (!visibleTurfs || !draw) return;

    draw.deleteAll();

    // Add existing polygons from your array
    visibleTurfs.forEach((turf) => {
      draw.add({
        type: "Feature",
        properties: { ...turf },
        geometry: turf.polygon,
      });
    });
  }, [visibleTurfs, draw, viewConfig?.showTurf]);

  // Hover behavior
  useEffect(() => {
    if (!ready) return;

    const map = localMapRef.current;

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (map) {
        const features = map.queryRenderedFeatures(e.point, {
          // Filter out layers that aren't ready
          layers: markerLayers.filter((layer: string) => map.getLayer(layer)),
        });
        if (features?.length) {
          const feature = features[0];
          setHoverMarker({
            coordinates: [e.lngLat.lng, e.lngLat.lat],
            properties: feature.properties || {},
          });
          if (map.getCanvas().style.cursor !== "pointer") {
            prevPointer.current = map.getCanvas().style.cursor || "";
          }
          map.getCanvas().style.cursor = "pointer";
        } else {
          setHoverMarker(null);
          if (map.getCanvas().style.cursor === "pointer") {
            map.getCanvas().style.cursor = prevPointer.current;
          }
        }
      }
    };

    const onMouseLeave = () => {
      if (map) {
        setHoverMarker(null);
        map.getCanvas().style.cursor = "";
      }
    };

    const handleModeChange = (e: DrawModeChangeEvent) => {
      setCurrentMode(e.mode);
    };

    map?.on("mousemove", onMouseMove);
    map?.on("mouseleave", onMouseLeave);
    map?.on("draw.modechange", handleModeChange);

    return () => {
      if (map) {
        map.off("mousemove", onMouseMove);
        map.off("mouseleave", onMouseLeave);
        map.off("draw.modechange", handleModeChange);
      }
    };
  }, [localMapRef, markerLayers, ready]);

  // Draw component cleanup
  useEffect(() => {
    const map = localMapRef.current;

    return () => {
      if (draw && map) {
        map.getMap().removeControl(draw);
      }
    };
  }, [draw, localMapRef]);

  // Show/Hide labels
  const toggleLabelVisibility = useCallback(
    (show: boolean) => {
      const map = localMapRef.current;

      if (map && styleLoaded) {
        const style = map.getStyle();
        const labelLayerIds = style.layers
          .filter(
            (layer) => layer.type === "symbol" && layer.layout?.["text-field"],
          )
          .map((layer) => layer.id);

        labelLayerIds.forEach((id) => {
          map
            .getMap()
            .setLayoutProperty(id, "visibility", show ? "visible" : "none");
        });
      }
    },
    [localMapRef, styleLoaded],
  );

  const getClickedPolygonFeature = (
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

  useEffect(() => {
    toggleLabelVisibility(viewConfig.showLabels);
  }, [localMapRef, toggleLabelVisibility, viewConfig.showLabels]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const map = localMapRef.current;
    if (!map) return;

    const padding = {
      left: showControls ? CONTROL_PANEL_WIDTH : 0,
      top: 0,
      bottom: 0,
    };

    // Public map mobile padding
    if (window.innerWidth < 768) {
      padding.top = 96;
      padding.bottom = window.innerHeight * 0.5;
    }

    map.easeTo({
      padding,
      duration: 300,
      easing: (t) => t * (2 - t),
    });
  }, [localMapRef, showControls]);

  useEffect(() => {
    const map = localMapRef.current;
    if (!map || didInitialFit || markerQueries?.isFetching) {
      return;
    }

    const placedMarkerFeatures = placedMarkers?.length
      ? placedMarkers.map((m) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [m.point.lng, m.point.lat], // [lng, lat]
          },
          properties: {},
        }))
      : [];

    const dataSourceMarkerFeatures =
      markerQueries?.data.flatMap((d) => d.markers) || [];

    const features = [...placedMarkerFeatures, ...dataSourceMarkerFeatures];

    if (features?.length) {
      const [minLng, minLat, maxLng, maxLat] = turf?.bbox({
        type: "FeatureCollection",
        features,
      });

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: {
            left: CONTROL_PANEL_WIDTH + 100,
            right: 100,
            top: 100,
            bottom: 100,
          },
          duration: 1000,
        },
      );
    }

    setDidInitialFit(true);
  }, [
    didInitialFit,
    mapConfig.markerDataSourceIds,
    mapConfig.membersDataSourceId,
    localMapRef,
    markerQueries?.data,
    markerQueries?.isFetching,
    placedMarkers,
  ]);

  return (
    <MapWrapper
      currentMode={pinDropMode ? "pin_drop" : currentMode}
      hideDrawControls={hideDrawControls}
    >
      <MapGL
        initialViewState={{
          longitude: -4.5481,
          latitude: 54.2361,
          zoom: DEFAULT_ZOOM,
          padding: {
            left: CONTROL_PANEL_WIDTH,
            top: 0,
            bottom: 0,
          },
        }}
        ref={(ref) => {
          localMapRef.current = ref;
          setMapRef(localMapRef);
        }}
        style={{ flexGrow: 1 }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={`mapbox://styles/mapbox/${getMapStyle(viewConfig).slug}`}
        interactiveLayerIds={markerLayers}
        onClick={(e) => {
          const map = e.target;
          const validMarkerLayers = markerLayers.filter((l: string) =>
            map.getLayer(l),
          );
          const features = map.queryRenderedFeatures(e.point, {
            layers: validMarkerLayers,
          });

          if (features.length && features[0].geometry.type === "Point") {
            const properties = features[0].properties;

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
              center: features[0].geometry.coordinates as [number, number],
              zoom: 12,
            });

            return;
          } else {
            resetInspector();
          }

          if (draw && currentMode !== "draw_polygon" && !pinDropMode) {
            const polygonFeature = getClickedPolygonFeature(draw, e);

            if (polygonFeature) {
              draw.changeMode("simple_select", { featureIds: [] });

              setSelectedTurf({
                id: polygonFeature.properties?.id,
                name: polygonFeature.properties?.label,
                geometry: polygonFeature.geometry as Polygon,
              });

              return;
            } else {
              resetInspector();
            }

            if (
              sourceId &&
              layerId &&
              featureCodeProperty &&
              featureNameProperty
            ) {
              try {
                const boundaryFeatures = map.queryRenderedFeatures(e.point, {
                  layers: [`${sourceId}-fill`, `${sourceId}-line`],
                });

                if (boundaryFeatures.length > 0) {
                  const feature = boundaryFeatures[0];
                  const areaCode = feature.properties?.[
                    featureCodeProperty
                  ] as string;
                  const areaName = feature.properties?.[
                    featureNameProperty
                  ] as string;

                  if (areaCode && areaName) {
                    // Prevent default context menu
                    e.originalEvent.preventDefault();

                    resetInspector();

                    setSelectedBoundary({
                      id: feature?.id as string,
                      areaCode: areaCode,
                      areaSetCode: areaSetCode || AreaSetCode.WMC24,
                      sourceLayerId: feature?.sourceLayer as string,
                      name: areaName,
                      properties: feature?.properties,
                    });

                    return;
                  }
                }
              } catch (error) {
                // Silently ignore errors - layers might not exist yet
                console.debug("Boundary query failed:", error);
              }
            }
          }
        }}
        onDblClick={(e) => {
          if (draw && currentMode !== "draw_polygon" && !pinDropMode) {
            const polygonFeature = getClickedPolygonFeature(draw, e);

            if (polygonFeature) {
              // enter edit mode
              (draw.changeMode as (mode: string, options?: object) => void)(
                "direct_select",
                {
                  featureId: polygonFeature.id,
                },
              );

              // Prevent default map zoom on double-click
              e.originalEvent.preventDefault();
              return;
            }
          }
        }}
        onLoad={() => {
          const map = localMapRef.current;
          if (!map) return;

          toggleLabelVisibility(viewConfig.showLabels);

          // Initialize draw if not already done
          if (!hideDrawControls && !draw) {
            const newDraw = new MapboxDraw({
              displayControlsDefault: false,
              controls: {
                polygon: true,
              },
              userProperties: true,
              styles: [
                {
                  id: "gl-draw-polygon-fill",
                  type: "fill",
                  filter: [
                    "all",
                    ["==", "$type", "Polygon"],
                    ["!=", "mode", "draw_polygon"],
                  ],
                  paint: {
                    "fill-color": mapColors.areas.color,
                    "fill-opacity": 0.3,
                  },
                },
                {
                  id: "gl-draw-polygon-stroke",
                  type: "line",
                  filter: ["all", ["==", "$type", "Polygon"]],
                  paint: {
                    "line-color": mapColors.areas.color,
                    "line-width": 2,
                  },
                },
                {
                  id: "gl-draw-polygon-and-line-vertex-halo-active",
                  type: "circle",
                  filter: [
                    "all",
                    ["==", "meta", "vertex"],
                    ["==", "$type", "Point"],
                  ],
                  paint: {
                    "circle-radius": 11,
                    "circle-color": "#FFF",
                  },
                },
                {
                  id: "gl-draw-polygon-and-line-vertex-active",
                  type: "circle",
                  filter: [
                    "all",
                    ["==", "meta", "vertex"],
                    ["==", "$type", "Point"],
                  ],
                  paint: {
                    "circle-radius": 10,
                    "circle-color": mapColors.areas.color,
                  },
                },
              ],
            });
            setDraw(newDraw);

            const mapInstance = map.getMap();
            mapInstance.addControl(newDraw, "bottom-right");

            // Add event listeners for drawing
            mapInstance.on("draw.create", () => {
              const data = newDraw.getAll();
              if (data.features.length > 0) {
                const feature = data.features[data.features.length - 1];
                const area = turf.area(feature);
                const roundedArea = Math.round(area * 100) / 100;
                insertTurf({
                  id: uuidv4(),
                  label: feature.properties?.name || "",
                  notes: "",
                  area: roundedArea,
                  polygon: feature.geometry as Polygon,
                });
              }
            });

            // When user updates polygon on the map
            mapInstance.on("draw.update", (e: MapboxDraw.DrawUpdateEvent) => {
              if (e.features.length > 0) {
                e?.features?.forEach((feature) => {
                  const area = turf.area(feature);
                  const roundedArea = Math.round(area * 100) / 100;

                  // Update your turf using the feature.id
                  updateTurf({
                    id: feature?.properties?.id,
                    notes: feature?.properties?.notes,
                    label: feature?.properties?.label,
                    area: roundedArea,
                    polygon: feature.geometry as Polygon,
                    createdAt: new Date(
                      feature?.properties?.createdAt as string,
                    ),
                  });
                });
              }
            });

            // Add delete handler
            mapInstance.on("draw.delete", (e: DrawDeleteEvent) => {
              const deletedIds = e.features.map((f) => f.id);
              for (const id of deletedIds) {
                deleteTurf(id);
              }
            });
          }
          setReady(true);
        }}
        onMoveEnd={async (e) => {
          const bounds = e.target.getBounds();
          const boundingBox = bounds
            ? {
                north: bounds.getNorth(),
                east: bounds.getEast(),
                south: bounds.getSouth(),
                west: bounds.getWest(),
              }
            : null;
          setBoundingBox(boundingBox);
          setZoom(e.viewState.zoom);
        }}
        onSourceData={(e) => {
          if (e.sourceId && MAPBOX_SOURCE_IDS.includes(e.sourceId)) {
            onSourceLoad(e.sourceId);
          }
        }}
        onStyleData={(e) => {
          /* @ts-expect-error The style property is missing in the MapBox type definitions */
          onSourceLoad(e.style.globalId);
          setStyleLoaded(true);

          const map = localMapRef.current?.getMap();
          if (map) {
            const layers = map.getStyle().layers;
            if (!layers) return;

            layers.forEach((layer) => {
              // Filter to find built-in label layers (all have layout["text-field] = ["coalesce", ["get", "name"]])
              if (
                layer.type === "symbol" &&
                layer.layout?.["text-field"] &&
                Array.isArray(layer.layout["text-field"]) &&
                layer.layout["text-field"][0] === "coalesce" &&
                layer.layout["text-field"].find(
                  (i) => Array.isArray(i) && i.includes("name"),
                )
              ) {
                map.setLayoutProperty(layer.id, "text-field", [
                  "coalesce",
                  ["get", "name_en"],
                  ["get", "name"], // Fallback if English name doesn't exist
                ]);
              }
            });
          }
        }}
      >
        {ready && (
          <>
            <Choropleth />
            <FilterMarkers />
            <PlacedMarkers />
            <Markers />
            {searchMarker && <SearchResultMarker />}
            {hoverMarker && (
              <Popup
                longitude={hoverMarker.coordinates[0]}
                latitude={hoverMarker.coordinates[1]}
                closeButton={false}
              >
                <p className="font-sans font-semibold text-sm">
                  {String(hoverMarker.properties[MARKER_NAME_KEY])}
                </p>
              </Popup>
            )}
          </>
        )}
      </MapGL>
    </MapWrapper>
  );
}
