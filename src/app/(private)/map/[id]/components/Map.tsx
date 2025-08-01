import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";
import * as mapboxgl from "mapbox-gl";
import { useContext, useEffect, useState } from "react";
import MapGL, { NavigationControl, Popup } from "react-map-gl/mapbox";
import { v4 as uuidv4 } from "uuid";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { MAPBOX_SOURCE_IDS } from "@/app/(private)/map/[id]/sources";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { DEFAULT_ZOOM, MARKER_ID_KEY, MARKER_NAME_KEY } from "@/constants";
import { DrawDeleteEvent, MarkerData } from "@/types";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import Choropleth from "./Choropleth";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
import TurfPolygons from "./TurfPolygons";

export default function Map({
  onSourceLoad,
}: {
  onSourceLoad: (sourceId: string) => void;
}) {
  const { mapRef, mapConfig, viewConfig, setBoundingBox, setZoom } =
    useContext(MapContext);
  const { insertPlacedMarker, setSelectedMarker, deleteTurf, insertTurf } =
    useContext(MarkerAndTurfContext);

  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const [ready, setReady] = useState(false);
  const [hoverMarker, setHoverMarker] = useState<MarkerData | null>(null);

  const markerLayers = [
    mapConfig.membersDataSourceId,
    ...mapConfig.markerDataSourceIds,
  ]
    .filter(Boolean)
    .flatMap((id) => [`${id}-markers-pins`, `${id}-markers-labels`])
    .concat(["search-history-pins", "search-history-labels"]);

  const clusterLayers = [
    mapConfig.membersDataSourceId,
    ...mapConfig.markerDataSourceIds,
  ]
    .filter(Boolean)
    .flatMap((id) => [`${id}-markers-circles`, `${id}-markers-counts`]);

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
          map.getCanvas().style.cursor = "pointer";
        } else {
          setHoverMarker(null);
          map.getCanvas().style.cursor = "";
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
  }, [draw, mapRef, markerLayers]);

  useEffect(() => {
    const map = mapRef?.current;

    if (draw && map) {
      map.getMap().removeControl(draw);
    }
  }, [draw, mapRef]);

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
        const clusters = map.queryRenderedFeatures(e.point, {
          layers: clusterLayers,
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
                geometry: feature.geometry,
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
          <TurfPolygons />
          <Markers />
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
                    `ID: ${hoverMarker.properties[MARKER_ID_KEY]}`}
                </strong>
              </div>
            </Popup>
          )}
        </>
      )}
    </MapGL>
  );
}
