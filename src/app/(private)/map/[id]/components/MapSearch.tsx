"use client";

import dynamic from "next/dynamic";
import { useContext, useEffect, useState } from "react";
import { MapContext } from "../context/MapContext";

const SearchBox = dynamic(
  // @ts-expect-error - SearchBox component type compatibility issue
  () =>
    import("@mapbox/search-js-react").then((mod) => ({
      default: mod.SearchBox,
    })),
  { ssr: false }
);

export default function MapSearch() {
  const { insertPlacedMarker, mapRef } = useContext(MapContext);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  // not sure what this type should be
  const handleRetrieve = (result: any) => {
    insertPlacedMarker({
      id: `placed-marker-temp-${new Date().getTime()}`,
      label:
        result.features[0].properties.name ||
        result.features[0].properties.full_address,
      notes: "",
      point: {
        lng: result.features[0].geometry.coordinates[0],
        lat: result.features[0].geometry.coordinates[1],
      },
    });
    mapRef?.current?.getMap().flyTo({
      center: [
        result.features[0].geometry.coordinates[0],
        result.features[0].geometry.coordinates[1],
      ],
      zoom: 15,
    });
  };

  if (!isClient) {
    return (
      <div className="absolute top-4 right-4 z-10 w-80 bg-white rounded-lg shadow-lg h-10 animate-pulse" />
    );
  }

  return (
    <div className="absolute top-4 right-4 z-10 w-80 bg-white rounded-lg shadow-lg">
      <SearchBox
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
        placeholder="Search for a UK location..."
        options={{
          country: "GB",
          language: "en",
          types: "place,address,poi",
        }}
        onRetrieve={handleRetrieve}
      />
    </div>
  );
}
