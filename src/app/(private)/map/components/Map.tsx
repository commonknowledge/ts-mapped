import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";
import * as mapboxgl from "mapbox-gl";
import { ReactNode, RefObject, useEffect, useState } from "react";
import MapGL, { MapRef } from "react-map-gl/mapbox";
import { BoundingBoxInput } from "@/__generated__/types";
import { MAPBOX_SOURCE_IDS } from "@/app/(private)/map/sources";
import { mapColors } from "@/app/(private)/map/styles";
import {
  DrawDeleteEvent,
  DrawnPolygon,
  MarkerData,
  SearchResult,
} from "@/types";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { MapConfig } from "./Controls";

const DEFAULT_ZOOM = 5;

interface MapProps {
  children: ReactNode;
  mapConfig: MapConfig;
  onClickMarker: (markerData: MarkerData | null) => void;
  onMoveEnd: (boundingBox: BoundingBoxInput | null, zoom: number) => void;
  onSourceLoad: (sourceId: string) => void;
  mapRef: RefObject<MapRef | null>;
  searchHistory: SearchResult[];
  setSearchHistory: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  setTurfHistory: React.Dispatch<React.SetStateAction<DrawnPolygon[]>>;
}

export default function Map({
  children,
  mapConfig,
  onClickMarker,
  onMoveEnd,
  onSourceLoad,
  mapRef,
  setSearchHistory,
  setTurfHistory,
}: MapProps) {
  const [draw, setDraw] = useState<MapboxDraw | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    return () => {
      if (draw && map) {
        map.getMap().removeControl(draw);
      }
    };
  }, [mapRef, draw]);

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
      mapStyle={`mapbox://styles/mapbox/${mapConfig.mapStyle.slug}`}
      onClick={(e) => {
        const map = e.target;
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["markers-pins"],
        });
        if (features.length && features[0].geometry.type === "Point") {
          onClickMarker({
            id: 1,
            properties: features[0].properties || {},
            coordinates: features[0].geometry.coordinates,
          });
        } else {
          onClickMarker(null);
        }
      }}
      onLoad={() => {
        const map = mapRef.current;
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
          setSearchHistory((prev: SearchResult[]) =>
            [
              {
                text: result.place_name,
                coordinates: result.center as [number, number],
                timestamp: new Date(),
              } as SearchResult,
              ...prev,
            ].slice(0, 10),
          );
        });

        map.addControl(geocoder, "top-right");

        // Initialize draw if not already done
        if (!draw) {
          const newDraw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
              point: true,
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
                  "fill-color": mapColors.turf.color,
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
                  "line-color": mapColors.turf.color,
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

              setTurfHistory((prev) =>
                [
                  {
                    id: feature.id?.toString() || crypto.randomUUID(),
                    area: roundedArea,
                    geometry: feature.geometry,
                    timestamp: new Date(),
                    name: feature.properties?.name || "",
                  },
                  ...prev,
                ].slice(0, 10),
              );

              newDraw.deleteAll();
            }
          });

          // Add delete handler
          mapInstance.on("draw.delete", (e: DrawDeleteEvent) => {
            const deletedIds = e.features.map((f) => f.id);
            setTurfHistory((prev) =>
              prev.filter((poly) => !deletedIds.includes(poly.id)),
            );
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
        onMoveEnd(boundingBox, e.viewState.zoom);
      }}
      onSourceData={(e) => {
        if (e.sourceId && MAPBOX_SOURCE_IDS.includes(e.sourceId)) {
          onSourceLoad(e.sourceId);
        }
      }}
    >
      {children}
    </MapGL>
  );
}
