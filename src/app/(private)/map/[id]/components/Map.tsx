import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";
import * as mapboxgl from "mapbox-gl";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import MapGL, { NavigationControl, Popup } from "react-map-gl/mapbox";
import { v4 as uuidv4 } from "uuid";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { MAPBOX_SOURCE_IDS } from "@/app/(private)/map/[id]/sources";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import {
  DEFAULT_ZOOM,
  MARKER_EXTERNAL_ID_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import { DrawDeleteEvent, DrawModeChangeEvent, MarkerData } from "@/types";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import Choropleth from "./Choropleth";
import FilterMarkers from "./FilterMarkers";
import MapWrapper from "./MapWrapper";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
// import TurfPolygons from "./TurfPolygons";

export default function Map({
  onSourceLoad,
}: {
  onSourceLoad: (sourceId: string) => void;
}) {
  const {
    mapRef,
    mapConfig,
    viewConfig,
    setBoundingBox,
    setZoom,
    pinDropMode,
  } = useContext(MapContext);
  const {
    insertPlacedMarker,
    setSelectedMarker,
    deleteTurf,
    insertTurf,
    updateTurf,
    turfs,
  } = useContext(MarkerAndTurfContext);

  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const [ready, setReady] = useState(false);
  const [hoverMarker, setHoverMarker] = useState<MarkerData | null>(null);
  const [currentMode, setCurrentMode] = useState<string | null>("");
  const prevPointer = useRef("");

  const markerLayers = [
    mapConfig.membersDataSourceId,
    ...mapConfig.markerDataSourceIds,
  ]
    .filter(Boolean)
    .flatMap((id) => [`${id}-markers-pins`, `${id}-markers-labels`])
    .concat(["search-history-pins", "search-history-labels"]);

  useEffect(() => {
    if (!draw) {
      return;
    }

    if (turfs?.length) {
      draw.deleteAll();

      // Add existing polygons from your array
      turfs.forEach((turf) => {
        draw.add({
          type: "Feature",
          properties: { ...turf },
          geometry: turf.polygon,
        });
      });
    }
  }, [turfs, draw]);

  // Hover behavior
  useEffect(() => {
    const map = mapRef?.current;

    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (map) {
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
  }, [mapRef, markerLayers]);

  // Draw component cleanup
  useEffect(() => {
    const map = mapRef?.current;

    return () => {
      if (draw && map) {
        map.getMap().removeControl(draw);
      }
    };
  }, [draw, mapRef]);

  // Show/Hide labels
  const toggleLabelVisibility = useCallback(
    (show: boolean) => {
      const map = mapRef?.current;

      if (map) {
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
    [mapRef],
  );

  useEffect(() => {
    toggleLabelVisibility(viewConfig.showLabels);
  }, [mapRef, toggleLabelVisibility, viewConfig.showLabels]);

  return (
    <MapWrapper currentMode={pinDropMode ? "pin_drop" : currentMode}>
      <MapGL
        initialViewState={{
          longitude: -4.5481,
          latitude: 54.2361,
          zoom: DEFAULT_ZOOM,
        }}
        ref={mapRef}
        style={{ flexGrow: 1 }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={`mapbox://styles/mapbox/${viewConfig.getMapStyle().slug}`}
        interactiveLayerIds={markerLayers}
        onClick={(e) => {
          const map = e.target;
          const features = map.queryRenderedFeatures(e.point, {
            layers: markerLayers,
          });
          if (features.length && features[0].geometry.type === "Point") {
            setSelectedMarker({
              properties: features[0].properties || {},
              coordinates: features[0].geometry.coordinates,
            });
            map.flyTo({
              center: features[0].geometry.coordinates as [number, number],
              zoom: 12,
            });
          } else {
            setSelectedMarker(null);
          }
        }}
        onLoad={() => {
          const map = mapRef?.current;
          if (!map) {
            return;
          }

          toggleLabelVisibility(viewConfig.showLabels);

          const geocoder = new MapboxGeocoder({
            accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
            mapboxgl: mapboxgl,
            countries: "GB", // TODO: remove when we support other countries
          });

          // Listen for search results
          geocoder.on("result", (event) => {
            const result = event.result;
            insertPlacedMarker({
              id: uuidv4(),
              label: result.place_name,
              notes: "",
              point: { lng: result.center[0], lat: result.center[1] },
              folderId: null,
            });
            geocoder.clear();
          });

          map.addControl(geocoder, "top-right");

          // Initialize draw if not already done
          if (!draw) {
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
                    ["!=", "mode", "draw"],
                  ],
                  paint: {
                    "fill-color": mapColors.areas.color,
                    "fill-opacity": 0.3,
                  },
                },
                {
                  id: "gl-draw-polygon-stroke",
                  type: "line",
                  filter: [
                    "all",
                    ["==", "$type", "Polygon"],
                    ["!=", "mode", "draw"],
                  ],
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
                    "circle-radius": 6,
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
                    "circle-radius": 5,
                    "circle-color": mapColors.areas.color,
                  },
                },
              ],
            });
            setDraw(newDraw);

            const mapInstance = map.getMap();
            mapInstance.addControl(newDraw, "top-right");

            // Add event listeners for drawing
            mapInstance.on("draw.create", () => {
              const data = newDraw.getAll();
              if (data.features.length > 0) {
                const feature = data.features[data.features.length - 1];
                const area = turf.area(feature);
                const roundedArea = Math.round(area * 100) / 100;
                insertTurf({
                  id: `turf-temp-${new Date().getTime()}`,
                  label:
                    feature.properties?.name ||
                    `Area: ${roundedArea.toFixed(2)}m²`,
                  notes: "",
                  area: roundedArea,
                  polygon: feature.geometry,
                  createdAt: new Date().toISOString(),
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
                    polygon: feature.geometry,
                    createdAt: feature?.properties?.createdAt,
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
        }}
      >
        {ready && (
          <>
            <NavigationControl showZoom={true} showCompass={false} />
            <Choropleth />
            {/* <TurfPolygons /> */}
            <FilterMarkers />
            <PlacedMarkers />
            <Markers />
            {hoverMarker && (
              <Popup
                longitude={hoverMarker.coordinates[0]}
                latitude={hoverMarker.coordinates[1]}
                closeButton={false}
              >
                <div>
                  <strong>
                    {String(hoverMarker.properties[MARKER_NAME_KEY]) ||
                      `ID: ${hoverMarker.properties[MARKER_EXTERNAL_ID_KEY]}`}
                  </strong>
                </div>
              </Popup>
            )}
          </>
        )}
      </MapGL>
    </MapWrapper>
  );
}
