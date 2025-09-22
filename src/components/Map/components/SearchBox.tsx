"use client";

import { SearchBox as _SearchBox } from "@mapbox/search-js-react";
import mapboxgl from "mapbox-gl";
import { useContext, useState } from "react";
import { MapContext } from "../context/MapContext";
import { MarkerAndTurfContext } from "../context/MarkerAndTurfContext";
import styles from "./SearchBox.module.css";

export function SearchBox() {
  const { mapRef } = useContext(MapContext);
  const { setSearchMarker } = useContext(MarkerAndTurfContext);
  const [search, setSearch] = useState("");

  return (
    <div className={styles["search-box"]}>
      {/* @ts-expect-error The MapBox SearchBox component fails React component typescript validation, but it does work */}
      <_SearchBox
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
