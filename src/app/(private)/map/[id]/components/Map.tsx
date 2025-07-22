import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";
import * as mapboxgl from "mapbox-gl";
import { useContext, useEffect, useState } from "react";
import MapGL from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { MAPBOX_SOURCE_IDS } from "@/app/(private)/map/[id]/sources";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { DEFAULT_ZOOM } from "@/constants";
import { DrawDeleteEvent } from "@/types";
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

  useEffect(() => {
    const map = mapRef?.current;
    return () => {
      if (draw && map) {
        map.getMap().removeControl(draw);
      }
    };
  }, [mapRef, draw]);

  const markerLayers = [
    mapConfig.membersDataSourceId,
    ...mapConfig.markerDataSourceIds,
  ]
    .filter(Boolean)
    .map((id) => `${id}-markers-pins`);

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
      onClick={(e) => {
        const map = e.target;
        const features = map.queryRenderedFeatures(e.point, {
          layers: markerLayers,
        });
        if (features.length && features[0].geometry.type === "Point") {
          setSelectedMarker({
            id: 1,
            properties: features[0].properties || {},
            coordinates: features[0].geometry.coordinates,
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

        const geocoder = new MapboxGeocoder({
          accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
          mapboxgl: mapboxgl,
        });

        // Listen for search results
        geocoder.on("result", (event) => {
          const result = event.result;
          insertPlacedMarker({
            id: `placed-marker-temp-${new Date().getTime()}`,
            label: result.place_name,
            notes: "",
            point: { lng: result.center[0], lat: result.center[1] },
          });
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
          <Choropleth />
          <TurfPolygons />
          <Markers />
          <PlacedMarkers />
        </>
      )}
    </MapGL>
  );
}
