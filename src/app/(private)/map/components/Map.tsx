import { ReactNode, RefObject, useEffect, useState } from "react";
import MapGL, { MapRef } from "react-map-gl/mapbox";
import { BoundingBox } from "@/__generated__/types";
import { MAPBOX_SOURCE_IDS } from "@/app/(private)/map/sources";
import {
  MarkerData,
  SearchResult,
  DrawnPolygon,
  DrawDeleteEvent,
} from "@/types";
import { MapConfig } from "./Controls";
import { mapColors } from "@/app/(private)/map/styles";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import DrawCreateEvent from "@mapbox/mapbox-gl-draw";
const DEFAULT_ZOOM = 5;

interface MapProps {
  children: ReactNode;
  mapConfig: MapConfig;
  onClickMarker: (markerData: MarkerData | null) => void;
  onMoveEnd: (boundingBox: BoundingBox | null, zoom: number) => void;
  onSourceLoad: (sourceId: string) => void;
  ref: RefObject<MapRef | null>;
  searchHistory: SearchResult[];
  setSearchHistory: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  TurfHistory: DrawnPolygon[];
  setTurfHistory: React.Dispatch<React.SetStateAction<DrawnPolygon[]>>;
}

export default function Map({
  children,
  mapConfig,
  onClickMarker,
  onMoveEnd,
  onSourceLoad,
  ref,
  searchHistory,
  setSearchHistory,
  TurfHistory,
  setTurfHistory,
}: MapProps) {
  const [draw, setDraw] = useState<MapboxDraw | null>(null);

  useEffect(() => {
    return () => {
      if (draw && ref.current) {
        ref.current.getMap().removeControl(draw as any);
      }
    };
  }, [ref, draw]);

  return (
    <MapGL
      initialViewState={{
        longitude: -4.5481,
        latitude: 54.2361,
        zoom: DEFAULT_ZOOM,
      }}
      ref={ref}
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
        const map = ref.current;
        if (!map) return;

        const geocoder = new MapboxGeocoder({
          accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
          mapboxgl: mapboxgl as any,
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
            ].slice(0, 10)
          );
        });

        map.addControl(geocoder, "top-right");

        // Initialize draw if not already done
        if (!draw) {
          const newDraw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              trash: true,
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
          mapInstance.addControl(newDraw as any, "top-right");

          // Add event listeners for drawing
          mapInstance.on("draw.create", (e: DrawCreateEvent) => {
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
                ].slice(0, 10)
              );

              newDraw.deleteAll();
            }
          });

          // Add delete handler
          mapInstance.on("draw.delete", (e: DrawDeleteEvent) => {
            const deletedIds = e.features.map((f) => f.id);
            setTurfHistory((prev) =>
              prev.filter((poly) => !deletedIds.includes(poly.id))
            );
          });
        }

        const imageURL = "/map-pin.png";
        map.loadImage(imageURL, (error, image) => {
          if (error) {
            console.error(`Could not load image ${imageURL}: ${error}`);
          }
          if (image && !map.hasImage("map-pin")) {
            map.addImage("map-pin", image);
          }
        });
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
