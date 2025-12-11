"use client";

import { SearchBox as _SearchBox } from "@mapbox/search-js-react";
import mapboxgl from "mapbox-gl";
import { useState } from "react";
import { useMapRef } from "../hooks/useMapState";
import { usePlacedMarkerState } from "../hooks/usePlacedMarkers";
import styles from "./SearchBox.module.css";

export function SearchBox() {
  const mapRef = useMapRef();
  const { setSearchMarker } = usePlacedMarkerState();
  const [search, setSearch] = useState("");

  return (
    <div className={styles["search-box"]}>
      {/* @ts-expect-error The MapBox SearchBox component fails React component typescript validation, but it does work */}
      <_SearchBox
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
        onChange={(d) => {
          setSearch(d);
        }}
        onRetrieve={(e) => {
          setSearchMarker(e.features.length ? e.features[0] : null);
        }}
      />
    </div>
  );
}
