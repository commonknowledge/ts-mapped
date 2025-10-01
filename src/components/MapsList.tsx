import MapCard from "@/components/MapCard";
import type { MapCardInterface } from "@/components/MapCard";

export function MapsList({ maps }: { maps: MapCardInterface[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
      {maps?.map((map, index) => (
        <MapCard key={index} map={map} />
      ))}
    </div>
  );
}
