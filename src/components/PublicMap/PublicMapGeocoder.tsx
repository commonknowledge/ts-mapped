import { Point as GeoJSONPoint } from "geojson";
import { Search } from "lucide-react";
import { FormEvent, useContext, useState } from "react";
import { MapContext } from "@/components/Map/context/MapContext";
import { Input } from "@/shadcn/ui/input";
import type { Point } from "@/server/models/shared";

export default function PublicMapGeocoder({
  onGeocode,
  colourScheme,
  className,
}: {
  onGeocode: (point: Point) => void;
  colourScheme?: { primary: string; muted: string };
  className?: string;
}) {
  const { mapRef } = useContext(MapContext);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    const center = await doGeocode(search);
    if (center) {
      mapRef?.current?.flyTo({
        center,
        zoom: 14,
      });
      onGeocode({ lat: center[1], lng: center[0] });
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={onSubmit}>
      <div className="relative">
        <Input
          id="public-map-geocoder-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          placeholder="Search by address or postcode"
          className={className || "bg-white borderrounded-md shadow-none pl-8"}
          style={{
            borderColor: colourScheme?.primary || "#d1d5db",
          }}
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4  pointer-events-none"
          style={{
            color: colourScheme?.primary || "#6b7280",
          }}
        />
      </div>
      {notFound && <small className="text-red-500">Not found</small>}
    </form>
  );
}

async function doGeocode(search: string): Promise<[number, number] | null> {
  const geocodeUrl = new URL(
    "https://api.mapbox.com/search/geocode/v6/forward",
  );
  geocodeUrl.searchParams.set("q", search);
  geocodeUrl.searchParams.set("country", "GB");
  geocodeUrl.searchParams.set(
    "access_token",
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
  );

  const response = await fetch(geocodeUrl);
  if (!response.ok) {
    return null;
  }

  const results: { features?: { id: string; geometry: GeoJSONPoint }[] } =
    await response.json();

  if (!results.features?.length) {
    return null;
  }

  return results.features[0].geometry.coordinates as [number, number];
}
