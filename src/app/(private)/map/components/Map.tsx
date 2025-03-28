import { ReactNode, RefObject, useEffect, useState } from "react";
import MapGL, { MapRef } from "react-map-gl/mapbox";
import { BoundingBox } from "@/__generated__/types";
import { MAPBOX_SOURCE_IDS } from "@/app/(private)/map/sources";
import { MarkerData, SearchResult } from "@/types";
import { MapConfig } from "./Controls";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import mapboxgl from "mapbox-gl";
import SearchHistory from "./SearchHistory";
import SearchHistoryMarkers from "./SearchHistoryMarkers";

import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
const DEFAULT_ZOOM = 5;

export default function Map({
  children,
  mapConfig,
  onClickMarker,
  onMoveEnd,
  onSourceLoad,
  ref,
  searchHistory,
  setSearchHistory,
}: {
  children: ReactNode;
  mapConfig: MapConfig;
  onClickMarker: (markerData: MarkerData | null) => void;
  onMoveEnd: (boundingBox: BoundingBox | null, zoom: number) => void;
  onSourceLoad: (sourceId: string) => void;
  ref: RefObject<MapRef | null>;
  searchHistory: SearchResult[];
  setSearchHistory: React.Dispatch<React.SetStateAction<SearchResult[]>>;
}) {
  useEffect(() => {
    const map = ref.current;
    if (!map) {
      return;
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
  }, [ref]);

  return (
    <MapGL
      initialViewState={{
        longitude: -4.5481, // 54.2361° N, 4.5481° W
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
        if (!map) {
          return;
        }

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
          ); // Keep last 10 searches
        });

        map.addControl(geocoder, "top-right");

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
        // Trigger a re-render when known Map sources load
        if (e.sourceId && MAPBOX_SOURCE_IDS.includes(e.sourceId)) {
          onSourceLoad(e.sourceId);
        }
      }}
    >
      {children}
    </MapGL>
  );
}
