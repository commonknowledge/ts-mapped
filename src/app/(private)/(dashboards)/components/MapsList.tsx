import MapCard from "./MapCard";
import type { MapCardInterface } from "./MapCard";
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
    <ul className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
