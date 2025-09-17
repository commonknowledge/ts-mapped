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
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { MAPBOX_SOURCE_IDS } from "@/components/Map/sources";
import { CONTROL_PANEL_WIDTH, mapColors } from "@/components/Map/styles";
import {
  DEFAULT_ZOOM,
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_EXTERNAL_ID_KEY,
  MARKER_ID_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import Choropleth from "./Choropleth";
import FilterMarkers from "./FilterMarkers";
import MapWrapper from "./MapWrapper";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
import SearchResultMarker from "./SearchResultMarker";
import type { DrawDeleteEvent, DrawModeChangeEvent } from "@/types";

export default function Map({
  onSourceLoad,
  hideDrawControls,
}: {
  onSourceLoad: (sourceId: string) => void;
  hideDrawControls?: boolean;
}) {
  const {
    mapRef,
    mapConfig,
    viewConfig,
    setBoundingBox,
    setZoom,
    pinDropMode,
    showControls,
    ready,
    setReady,
  } = useContext(MapContext);
  const {
    deleteTurf,
    insertTurf,
    updateTurf,
    turfs,
    searchMarker,
    setSearchMarker,
  } = useContext(MarkerAndTurfContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);
  const [styleLoaded, setStyleLoaded] = useState(false);

  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const [hoverMarker, setHoverMarker] = useState<{
    coordinates: [number, number];
    properties: Record<string, unknown>;
  } | null>(null);
  const [currentMode, setCurrentMode] = useState<string | null>("");
  const prevPointer = useRef("");

  const markerLayers = useMemo(
    () =>
      mapConfig
        .getDataSourceIds()
        .flatMap((id) => [`${id}-markers-pins`, `${id}-markers-labels`])
        .concat(["search-history-pins", "search-history-labels"]),
    [mapConfig],
  );

  // draw existing turfs
  useEffect(() => {
    if (!draw) {
      return;
    }

    draw.deleteAll();

    // Add existing polygons from your array
    turfs.forEach((turf) => {
      draw.add({
        type: "Feature",
        properties: { ...turf },
        geometry: turf.polygon,
      });
    });
  }, [turfs, draw]);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const map = mapRef?.current;
    if (!map || !ready) {
      return;
    }

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
  }, [mapRef, ready, showControls]);

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
              marker: false,
              countries: "GB", // TODO: remove when we support other countries
            });

            // Listen for search results
            geocoder.on("result", (event) => {
              setSearchMarker(event.result);
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
                    id: `turf-temp-${new Date().getTime()}`,
                    label: feature.properties?.name || "",
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
            <NavigationControl
              showZoom={true}
              showCompass={false}
              position="bottom-right"
            />
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
