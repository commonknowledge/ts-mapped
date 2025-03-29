"use client";

import React, { useEffect, useRef } from "react";
import MapGL, { Source, Layer, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { mapColors } from "@/app/(private)/map/styles";
import { FeatureCollection, Feature, Polygon, Position } from "geojson";

interface ForumPostMapProps {
  features: FeatureCollection<Polygon>;
}

export default function ForumPostMap({ features }: ForumPostMapProps) {
  const mapRef = useRef<MapRef>(null);

  const bounds = features.features.reduce(
    (bounds, feature) => {
      const coordinates = feature.geometry.coordinates[0];
      coordinates.forEach((coord: Position) => {
        bounds.minLng = Math.min(bounds.minLng, coord[0]);
        bounds.maxLng = Math.max(bounds.maxLng, coord[0]);
        bounds.minLat = Math.min(bounds.minLat, coord[1]);
        bounds.maxLat = Math.max(bounds.maxLat, coord[1]);
      });
      return bounds;
    },
    {
      minLng: Infinity,
      maxLng: -Infinity,
      minLat: Infinity,
      maxLat: -Infinity,
    }
  );

  // Calculate appropriate zoom level based on bounds
  const calculateZoom = () => {
    const width = 400; // container width
    const height = 400; // container height
    const padding = 50; // padding in pixels

    const lngDiff = bounds.maxLng - bounds.minLng;
    const latDiff = bounds.maxLat - bounds.minLat;

    const lngZoom = Math.log2((360 * width) / (lngDiff * 256)) - 1;
    const latZoom = Math.log2((180 * height) / (latDiff * 256)) - 1;

    // Use the smaller zoom level to ensure the feature fits in both dimensions
    return Math.min(lngZoom, latZoom);
  };

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <MapGL
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        initialViewState={{
          longitude: (bounds.minLng + bounds.maxLng) / 2,
          latitude: (bounds.minLat + bounds.maxLat) / 2,
          zoom: calculateZoom(),
        }}
        minZoom={calculateZoom()}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        interactive={false}
      >
        <Source id="published-layers" type="geojson" data={features}>
          <Layer
            id="published-layers-fill"
            type="fill"
            paint={{
              "fill-color": mapColors.turf.color,
              "fill-opacity": 0.3,
            }}
          />
          <Layer
            id="published-layers-stroke"
            type="line"
            paint={{
              "line-color": mapColors.turf.color,
              "line-width": 2,
            }}
          />
          <Layer
            id="published-layers-labels"
            type="symbol"
            minzoom={10}
            layout={{
              "text-field": ["get", "name"],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 16,
              "text-anchor": "center",
              "text-justify": "center",
              "symbol-placement": "point",
              "text-allow-overlap": true,
            }}
            paint={{
              "text-color": mapColors.turf.textColor,
              "text-halo-color": "#fff",
              "text-halo-width": 1,
            }}
          />
        </Source>
      </MapGL>
    </div>
  );
}
