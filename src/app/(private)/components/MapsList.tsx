import MapCard from "@/app/(private)/components/MapCard";
import type { MapCardInterface } from "@/app/(private)/components/MapCard";
import type { ReactNode } from "react";

export function MapsList({
  maps,
  renderControls,
}: {
  maps: MapCardInterface[];
  renderControls?: (
    map: MapCardInterface,
    onMenuToggle: (open: boolean) => void,
  ) => ReactNode;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
      {maps?.map((map, index) => (
        <li key={index}>
          <MapCard
            map={map}
            renderControls={
              renderControls
                ? (onMenuToggle) => renderControls(map, onMenuToggle)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
