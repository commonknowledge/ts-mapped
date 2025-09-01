import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";
import * as mapboxgl from "mapbox-gl";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MapGL, { NavigationControl, Popup } from "react-map-gl/mapbox";
import { v4 as uuidv4 } from "uuid";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { MAPBOX_SOURCE_IDS } from "@/components/Map/sources";
import { mapColors } from "@/components/Map/styles";
import {
  DEFAULT_ZOOM,
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_EXTERNAL_ID_KEY,
  MARKER_ID_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import { DrawDeleteEvent } from "@/types";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import Choropleth from "./Choropleth";
import FilterMarkers from "./FilterMarkers";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
import TurfPolygons from "./TurfPolygons";

export default function Map({
  onSourceLoad,
  hideDrawControls,
}: {
  onSourceLoad: (sourceId: string) => void;
  hideDrawControls?: boolean;
}) {
  const { mapRef, mapConfig, viewConfig, setBoundingBox, setZoom } =
    useContext(MapContext);
  const { insertPlacedMarker, deleteTurf, insertTurf } =
    useContext(MarkerAndTurfContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);
  const [styleLoaded, setStyleLoaded] = useState(false);

  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const [ready, setReady] = useState(false);
  const [hoverMarker, setHoverMarker] = useState<{
    coordinates: [number, number];
    properties: Record<string, unknown>;
  } | null>(null);
  const prevPointer = useRef("");

  const markerLayers = useMemo(
    () =>
      mapConfig
        .getDataSourceIds()
        .flatMap((id) => [`${id}-markers-pins`, `${id}-markers-labels`])
        .concat(["search-history-pins", "search-history-labels"]),
    [mapConfig],
  );

  const clusterLayers = useMemo(
    () =>
      mapConfig
        .getDataSourceIds()
        .flatMap((id) => [`${id}-markers-circles`, `${id}-markers-counts`]),
    [mapConfig],
  );

  // Hover behavior
  useEffect(() => {
    if (!ready) {
      return;
    }

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

    map?.on("mousemove", onMouseMove);
    map?.on("mouseleave", onMouseLeave);

    return () => {
      if (map) {
        map.off("mousemove", onMouseMove);
        map.off("mouseleave", onMouseLeave);
      }
    };
  }, [mapRef, markerLayers, ready]);

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

  // Mobile padding to account for top bar and listings overlay
  const mobilePadding = useMemo(() => {
    if (typeof window === 'undefined') return undefined;

    // Only apply padding on mobile screens
    if (window.innerWidth >= 768) return undefined;

    return {
      top: 96, // 6rem (24 * 4) for top bar
      bottom: window.innerHeight * 0.5, // 50vh for listings
      left: 0,
      right: 0
    };
  }, []);

  return (
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
      padding={mobilePadding}
      onClick={(e) => {
        const map = e.target;
        const validMarkerLayers = markerLayers.filter((l) => map.getLayer(l));
        const features = map.queryRenderedFeatures(e.point, {
          layers: validMarkerLayers,
        });
        if (features.length && features[0].geometry.type === "Point") {
          const properties = features[0].properties;
          const dataRecordId = properties ? properties[MARKER_ID_KEY] : null;
          const dataSourceId = properties
            ? properties[MARKER_DATA_SOURCE_ID_KEY]
            : null;
          setSelectedDataRecord({
            id: dataRecordId,
            dataSourceId: dataSourceId,
          });
          map.flyTo({
            center: features[0].geometry.coordinates as [number, number],
            zoom: 12,
          });
        } else {
          setSelectedDataRecord(null);
        }
        const validClusterLayers = clusterLayers.filter((l) => map.getLayer(l));
        const clusters = map.queryRenderedFeatures(e.point, {
          layers: validClusterLayers,
        });
        if (clusters.length && clusters[0].geometry.type === "Point") {
          map.flyTo({
            center: clusters[0].geometry.coordinates as [number, number],
            zoom: map.getZoom() + 2,
          });
        }
      }}
      onLoad={() => {
        const map = mapRef?.current;
        if (!map) {
          return;
        }

        toggleLabelVisibility(viewConfig.showLabels);

        if (!hideDrawControls) {
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
                newDraw.deleteAll();
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
      }}
    >
      {ready && (
        <>
          <NavigationControl showZoom={true} showCompass={false} />
          <Choropleth />
          <TurfPolygons />
          <Markers />
          <FilterMarkers />
          <PlacedMarkers />
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
  );
}
