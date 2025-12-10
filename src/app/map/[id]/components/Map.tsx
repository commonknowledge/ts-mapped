import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL from "react-map-gl/mapbox";
import { v4 as uuidv4 } from "uuid";
import {
  getDataSourceIds,
  getMapStyle,
} from "@/app/map/[id]/context/MapContext";
import { useMapBounds } from "@/app/map/[id]/hooks/useMapBounds";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { DEFAULT_ZOOM } from "@/constants";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MapType } from "@/server/models/MapView";
import { getClickedPolygonFeature, useMapClick } from "../hooks/useMapClick";
import { useMapHover } from "../hooks/useMapHover";
import { useTurfMutations, useTurfState } from "../hooks/useTurfs";
import { CONTROL_PANEL_WIDTH, mapColors } from "../styles";
import AreaPopup from "./AreaPopup";
import Choropleth from "./Choropleth";
import { MAPBOX_SOURCE_IDS } from "./Choropleth/configs";
import FilterMarkers from "./FilterMarkers";
import MapWrapper from "./MapWrapper";
import MarkerPopup from "./MarkerPopup";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
import SearchResultMarker from "./SearchResultMarker";
import { useMapRefAtom, useSetZoom, usePinDropMode, useShowControls } from "../hooks/useMapState";
import type { Polygon } from "@/server/models/Turf";
import type { DrawDeleteEvent, DrawModeChangeEvent } from "@/types";
import type { MapRef } from "react-map-gl/mapbox";

export default function Map({
  onSourceLoad,
  hideDrawControls,
}: {
  onSourceLoad: (sourceId: string) => void;
  hideDrawControls?: boolean;
}) {
  const isMobile = useIsMobile();
  const localMapRef = useRef<MapRef>(null);
  const [, setMapRef] = useMapRefAtom();
  const setZoom = useSetZoom();
  const pinDropMode = usePinDropMode();
  const showControls = useShowControls();
  const { setBoundingBox } = useMapBounds();
  const [ready, setReady] = useState(false);
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { visibleTurfs } = useTurfState();
  const markerQueries = useMarkerQueries();
  const [styleLoaded, setStyleLoaded] = useState(false);

  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const [currentMode, setCurrentMode] = useState<string | null>("");
  const [didInitialFit, setDidInitialFit] = useState(false);

  const { insertTurf, updateTurf, deleteTurf } = useTurfMutations();
  
  // Sync local ref to jotai atom
  useEffect(() => {
    setMapRef(localMapRef);
  }, [setMapRef]);

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

  useMapClick({ markerLayers, draw, currentMode, ready });
  useMapHover({ markerLayers, draw, ready });

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

  // Save draw mode in context
  useEffect(() => {
    if (!ready) {
      return;
    }

    const map = localMapRef?.current;

    const handleModeChange = (e: DrawModeChangeEvent) => {
      setCurrentMode(e.mode);
    };

    map?.on("draw.modechange", handleModeChange);

    return () => {
      if (map) {
        map.off("draw.modechange", handleModeChange);
      }
    };
  }, [localMapRef, ready]);

  // Show/Hide labels
  const toggleLabelVisibility = useCallback(
    (show: boolean) => {
      const map = localMapRef?.current;

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

  useEffect(() => {
    toggleLabelVisibility(viewConfig.showLabels);
  }, [localMapRef, toggleLabelVisibility, viewConfig.showLabels]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const map = localMapRef?.current;
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
  }, [localMapRef, showControls, isMobile]);

  useEffect(() => {
    const map = localMapRef?.current;
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
        ref={localMapRef}
        style={{ flexGrow: 1 }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={`mapbox://styles/${getMapStyle(viewConfig).slug}`}
        interactiveLayerIds={markerLayers}
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
              e.preventDefault();
              return;
            }
          }
        }}
        onLoad={() => {
          const map = localMapRef?.current;
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

          const map = localMapRef?.current?.getMap();
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
        onRemove={() => {
          if (draw && localMapRef?.current) {
            localMapRef.current.getMap().removeControl(draw);
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
            <AreaPopup />
          </>
        )}
      </MapGL>
    </MapWrapper>
  );
}
