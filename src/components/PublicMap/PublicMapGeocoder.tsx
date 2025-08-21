import { Point as GeoJSONPoint } from "geojson";
import { FormEvent, useContext, useState } from "react";
import { MapContext } from "@/components/Map/context/MapContext";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Point } from "@/types";
import { Search } from "lucide-react";

export default function PublicMapGeocoder({
  onGeocode,
}: {
  onGeocode: (point: Point) => void;
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
          className="bg-white border border-neutral-300 rounded-md shadow-none pl-8"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      </div>
      {notFound && <small className="text-red-500">Not found</small>}
    </form>
  );
}

async function doGeocode(search: string): Promise<[number, number] | null> {
  const geocodeUrl = new URL(
    "https://api.mapbox.com/search/geocode/v6/forward"
  );
  geocodeUrl.searchParams.set("q", search);
  geocodeUrl.searchParams.set("country", "GB");
  geocodeUrl.searchParams.set(
    "access_token",
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
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
