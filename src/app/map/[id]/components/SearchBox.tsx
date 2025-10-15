"use client";

import { SearchBox as _SearchBox } from "@mapbox/search-js-react";
import mapboxgl from "mapbox-gl";
import { useContext, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import styles from "./SearchBox.module.css";

export function SearchBox() {
  const { mapRef } = useContext(MapContext);
  const { setSearchMarker } = useContext(MarkerAndTurfContext);
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
