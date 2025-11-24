import { SearchIcon } from "lucide-react";
import { useContext, useState } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import type { PublicMapColorScheme } from "@/app/map/[id]/styles";
import type { Point } from "@/server/models/shared";
import type { Point as GeoJSONPoint } from "geojson";
import type { FormEvent } from "react";

export default function PublicMapGeocoder({
  onGeocode,
  colorScheme,
  className,
}: {
  onGeocode: (point: Point) => void;
  colorScheme?: PublicMapColorScheme;
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
    <form className="flex flex-col gap-2 w-full" onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <Input
          id="public-map-geocoder-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
          placeholder="Search by address or postcode"
          className={className || "bg-white border rounded-md shadow-none"}
          style={
            {
              "--tw-ring-color": colorScheme?.primary,
              "--ring": colorScheme?.primary,
            } as React.CSSProperties
          }
        />
        <Button type="submit" aria-label="Search">
          <SearchIcon />
        </Button>
      </div>
      {notFound && (
        <small className="text-red-500 font-semibold">Not found</small>
      )}
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

  const results = (await response.json()) as {
    features?: { id: string; geometry: GeoJSONPoint }[];
  };

  if (!results.features?.length) {
    return null;
  }

  return results.features[0].geometry.coordinates as [number, number];
}
