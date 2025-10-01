import MapCard from "@/components/MapCard";
import type { MapCardInterface } from "@/components/MapCard";

export function MapsList({ maps }: { maps: MapCardInterface[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
      {maps?.map((map, index) => (
        <li key={index}>
          <MapCard map={map} />
        </li>
      ))}
    </ul>
  );
}
