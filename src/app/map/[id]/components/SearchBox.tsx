"use client";

import { SearchBox as _SearchBox } from "@mapbox/search-js-react";
import mapboxgl from "mapbox-gl";
import { useState } from "react";
import { useMapRef } from "../hooks/useMapCore";
import { usePlacedMarkerState } from "../hooks/usePlacedMarkers";
import styles from "./SearchBox.module.css";

// Type assertion to fix TypeScript compatibility issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SearchBoxComponent = _SearchBox as any;

export function SearchBox() {
  const mapRef = useMapRef();
  const { setSearchMarker } = usePlacedMarkerState();
  const [search, setSearch] = useState("");

  return (
    <div className={styles["search-box"]}>
      <SearchBoxComponent
        theme={{
          variables: {
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "none",
          },
        }}
        popoverOptions={{
          flip: true,
        }}
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
        map={mapRef?.current?.getMap()}
        mapboxgl={mapboxgl}
        options={{ country: "GB" }}
        value={search}
        onChange={(d: string) => {
          setSearch(d);
        }}
        onRetrieve={(e: {
          features: {
            geometry: { coordinates: [number, number] };
            properties?: Record<string, unknown>;
          }[];
        }) => {
          if (e.features.length > 0) {
            const feature = e.features[0];
            setSearchMarker({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: feature.geometry.coordinates,
              },
              properties: feature.properties || {},
            });
          } else {
            setSearchMarker(null);
          }
        }}
      />
    </div>
  );
}
