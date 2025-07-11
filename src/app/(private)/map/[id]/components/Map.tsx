"use client";

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";

import { useContext, useEffect } from "react";
import MapGL from "react-map-gl/mapbox";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MAPBOX_SOURCE_IDS } from "@/app/(private)/map/[id]/sources";
import { mapColours } from "@/app/(private)/map/[id]/styles";
import { DEFAULT_ZOOM } from "@/constants";
import { DrawDeleteEvent } from "@/types";

import Choropleth from "./Choropleth";
import MapSearch from "./MapSearch";
import Markers from "./Markers";
import PlacedMarkers from "./PlacedMarkers";
import TurfPolygons from "./TurfPolygons";

export default function Map({
  onSourceLoad,
}: {
  onSourceLoad: (sourceId: string) => void;
}) {
  const {
    mapRef,
    viewConfig,
    setBoundingBox,
    setSelectedMarker,
    deleteTurf,
    insertTurf,
    setZoom,
    draw,
    setDraw,
  } = useContext(MapContext);

  useEffect(() => {
    const map = mapRef?.current;
    return () => {
      if (draw && map) {
        map.getMap().removeControl(draw);
      }
    };
  }, [mapRef, draw]);

  return (
    <div className="relative w-full h-full">
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
            layers: ["markers-pins"],
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

          // SearchBox will be rendered separately in the JSX

          // Initialize draw if not already done
          if (!draw) {
            const newDraw = new MapboxDraw({
              displayControlsDefault: false,
              controls: {
                point: false,
                polygon: false,
                trash: false,
                combine_features: false,
                uncombine_features: false,
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
                    "fill-color": mapColours.areas.color,
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
                    "line-color": mapColours.areas.color,
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
        <Choropleth />
        <Markers />
        <MapSearch />

        <PlacedMarkers />
        <TurfPolygons />
      </MapGL>
    </div>
  );
}
