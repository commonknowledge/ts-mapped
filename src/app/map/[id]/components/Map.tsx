import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import { useCallback, useEffect, useMemo, useState } from "react";
import MapGL from "react-map-gl/mapbox";
import { v4 as uuidv4 } from "uuid";
import { useMapBounds } from "@/app/map/[id]/hooks/useMapBounds";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { DEFAULT_ZOOM } from "@/constants";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MapType } from "@/server/models/MapView";
import { useDraw } from "../hooks/useDraw";
import { useInspector } from "../hooks/useInspector";
import { useSetZoom } from "../hooks/useMapCamera";
import {
  getClickedPolygonFeature,
  useMapClickEffect,
} from "../hooks/useMapClick";
import {
  useEditAreaMode,
  useMapControlsEscapeKeyEffect,
  usePinDropMode,
  useSetEditAreaMode,
  useShowControls,
} from "../hooks/useMapControls";
import { useMapRef } from "../hooks/useMapCore";
import { useMapHoverEffect } from "../hooks/useMapHover";
import { useTurfMutations } from "../hooks/useTurfMutations";
import { useTurfState, useWatchDrawModeEffect } from "../hooks/useTurfState";
import { CONTROL_PANEL_WIDTH, mapColors } from "../styles";
import { getDataSourceIds, getMapStyle } from "../utils/map";
import Choropleth from "./Choropleth";
import { MAPBOX_SOURCE_IDS } from "./Choropleth/configs";
import FilterMarkers from "./FilterMarkers";
import MapWrapper from "./MapWrapper";
import MarkerPopup from "./MarkerPopup";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
import SearchResultMarker from "./SearchResultMarker";
import type { Polygon } from "@/server/models/Turf";
import type { DrawDeleteEvent, DrawModeChangeEvent } from "@/types";

export default function Map({
  onSourceLoad,
  hideDrawControls,
}: {
  onSourceLoad: (sourceId: string) => void;
  hideDrawControls?: boolean;
}) {
  const isMobile = useIsMobile();
  const mapRef = useMapRef();
  const setZoom = useSetZoom();
  const pinDropMode = usePinDropMode();
  const editAreaMode = useEditAreaMode();
  const setEditAreaMode = useSetEditAreaMode();
  const showControls = useShowControls();
  const { setBoundingBox } = useMapBounds();
  const [ready, setReady] = useState(false);
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { visibleTurfs } = useTurfState();
  const markerQueries = useMarkerQueries();
  const [styleLoaded, setStyleLoaded] = useState(false);
  const { resetInspector, setSelectedTurf, selectedTurf } = useInspector();

  const [draw, setDraw] = useDraw();
  const [currentMode, setCurrentMode] = useState<string | null>("");
  const [didInitialFit, setDidInitialFit] = useState(false);

  const { insertTurf, updateTurf, deleteTurf } = useTurfMutations();

  const markerLayers = useMemo(
    () =>
      getDataSourceIds(mapConfig)
        .flatMap((id) => [
          `${id}-markers-circles`,
          `${id}-markers-counts`,
          `${id}-markers-pins`,
          `${id}-markers-labels`,
        ])
        .concat(["search-history-pins", "search-history-labels"]),
    [mapConfig],
  );

  useMapClickEffect({ markerLayers, draw, currentMode, ready });
  useMapHoverEffect({ markerLayers, draw, ready });
  useWatchDrawModeEffect();
  useMapControlsEscapeKeyEffect();

  // draw existing turfs
  useEffect(() => {
    if (!visibleTurfs || !draw) return;

    try {
      draw.deleteAll();
    } catch {
      // Ignore failure to remove existing turfs
    }

    // Add existing polygons from your array
    visibleTurfs.forEach((turf) => {
      draw.add({
        type: "Feature",
        properties: { ...turf },
        geometry: turf.polygon,
      });
    });
  }, [visibleTurfs, draw, viewConfig?.showTurf]);

  // Save draw mode in context
  useEffect(() => {
    if (!ready) {
      return;
    }

    const map = mapRef?.current;

    const handleModeChange = (e: DrawModeChangeEvent) => {
      setCurrentMode(e.mode);
    };

    map?.on("draw.modechange", handleModeChange);

    return () => {
      if (map) {
        map.off("draw.modechange", handleModeChange);
      }
    };
  }, [mapRef, ready]);

  // Fallback: if UI says edit mode is off but draw thinks it's still on, force exit
  useEffect(() => {
    if (!draw) return;
    if (!editAreaMode && currentMode === "draw_polygon") {
      (draw.changeMode as (mode: string) => void)("simple_select");
      setCurrentMode("simple_select");
    }
  }, [draw, editAreaMode, currentMode]);

  // Show/Hide labels
  const toggleLabelVisibility = useCallback(
    (show: boolean) => {
      const map = mapRef?.current;

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
    [mapRef, styleLoaded],
  );

  useEffect(() => {
    toggleLabelVisibility(viewConfig.showLabels);
  }, [mapRef, toggleLabelVisibility, viewConfig.showLabels]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const map = mapRef?.current;
    if (!map) return;

    const padding = {
      left: isMobile || !showControls ? 0 : CONTROL_PANEL_WIDTH,
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
  }, [mapRef, showControls, isMobile]);

  useEffect(() => {
    const map = mapRef?.current;
    if (
      !map ||
      didInitialFit ||
      markerQueries?.isFetching ||
      viewConfig.mapType === MapType.Hex
    ) {
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
            left: isMobile ? 0 : CONTROL_PANEL_WIDTH + 100,
            right: isMobile ? 0 : 100,
            top: isMobile ? 0 : 100,
            bottom: isMobile ? 0 : 100,
          },
          maxZoom: 12,
          duration: 1000,
        },
      );
    }

    setDidInitialFit(true);
  }, [
    didInitialFit,
    mapConfig.markerDataSourceIds,
    mapConfig.membersDataSourceId,
    mapRef,
    markerQueries?.data,
    markerQueries?.isFetching,
    placedMarkers,
    isMobile,
    viewConfig.mapType,
  ]);

  return (
    <MapWrapper
      currentMode={pinDropMode ? "pin_drop" : currentMode}
      hideDrawControls={hideDrawControls}
    >
      <MapGL
        key={viewConfig.mapType}
        maxBounds={
          viewConfig.mapType === MapType.Hex
            ? [
                [-9, -13],
                [17, 2.4],
              ]
            : undefined
        }
        projection={
          viewConfig.mapType === MapType.Hex ? "equirectangular" : "globe"
        }
        initialViewState={
          viewConfig.mapType === MapType.Hex
            ? {
                longitude: 2.5,
                latitude: -4.5,
                zoom: 6,
              }
            : {
                longitude: -4.5481,
                latitude: 54.2361,
                zoom: DEFAULT_ZOOM,
                padding: {
                  left: isMobile ? 0 : CONTROL_PANEL_WIDTH,
                  top: 0,
                  bottom: 0,
                },
              }
        }
        ref={mapRef}
        style={{ flexGrow: 1 }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={`mapbox://styles/${getMapStyle(viewConfig).slug}`}
        interactiveLayerIds={markerLayers}
        onClick={(e) => {
          // Prevent default turf single-click behavior
          // Code kept here to colocate with turf double click behavior below
          if (!draw || pinDropMode) {
            return;
          }

          const polygonFeature = getClickedPolygonFeature(draw, e);
          if (polygonFeature?.properties?.id) {
            draw.changeMode("simple_select");
          }
        }}
        onDblClick={(e) => {
          if (!draw || pinDropMode) {
            return;
          }

          const polygonFeature = getClickedPolygonFeature(draw, e);
          if (!polygonFeature) {
            return;
          }

          // Prevent default map zoom on double-click turf
          e.preventDefault();

          // prevent edit mode (preserved at right click / double right click)
          draw.changeMode("simple_select");
          setCurrentMode("simple_select");

          // If this turf is not already selected, select it and display it in the inspector
          const polygonId = polygonFeature.properties?.id;
          if (polygonId && polygonId !== selectedTurf?.id) {
            resetInspector();
            setSelectedTurf({
              id: polygonFeature.properties?.id,
              name: polygonFeature.properties?.label,
              geometry: polygonFeature.geometry as Polygon,
            });
          }
        }}
        onLoad={() => {
          const map = mapRef?.current;
          if (!map) {
            return;
          }

          toggleLabelVisibility(viewConfig.showLabels);

          // Initialize draw
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
                setEditAreaMode(false);
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

          const map = mapRef?.current?.getMap();
          if (map) {
            // Move draw (turf) layers above choropleth layers after a style change.
            // Only move if a draw layer is not already the topmost layer to avoid
            // an infinite loop (moveLayer fires another styledata event).
            if (draw) {
              const allLayerIds =
                map.getStyle()?.layers?.map((l) => l.id) || [];
              const lastLayerId = allLayerIds[allLayerIds.length - 1];
              if (lastLayerId && !lastLayerId.startsWith("gl-draw")) {
                const drawLayerIds = allLayerIds.filter((id) =>
                  id.startsWith("gl-draw"),
                );
                for (const id of drawLayerIds) {
                  map.moveLayer(id);
                }
              }
            }

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
        onRemove={() => {
          if (draw && mapRef?.current) {
            mapRef.current.getMap().removeControl(draw);
          }
          setDraw(null);
          setReady(false);
          setStyleLoaded(false);
        }}
      >
        {ready && (
          <>
            <Choropleth />
            <FilterMarkers />
            <PlacedMarkers />
            <Markers />
            <SearchResultMarker />
            <MarkerPopup />
          </>
        )}
      </MapGL>
    </MapWrapper>
  );
}
