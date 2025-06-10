import { RefObject } from "react";
import { MapRef } from "react-map-gl/mapbox";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";
import { PointFeature, SearchResult } from "@/types";
import { mapNodeColors } from "../styles";
import MarkerList from "./MarkerList";
import SearchHistory from "./SearchHistory";

export default function Layers({
  markersDataSource,
  mapRef,
  searchHistory,
}: {
  markersDataSource:
    | { name: string; markers: { features: PointFeature[] } }
    | undefined;
  mapRef: RefObject<MapRef | null>;
  searchHistory: SearchResult[];
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex flex-row gap-2 items-center">
          <div
            style={{ backgroundColor: mapNodeColors.searched.color }}
            className="rounded-full w-3 h-3"
          />
          <Label>Search History</Label>
        </div>
        <SearchHistory
          history={searchHistory}
          onSelect={(coordinates) => {
            const map = mapRef.current;
            if (map) {
              map.flyTo({
                center: coordinates,
                zoom: 12,
              });
            }
          }}
        />
      </div>
      <Separator />
      <div className="flex flex-col gap-1">
        <div className="flex flex-row gap-2 items-center">
          <div
            style={{ backgroundColor: mapNodeColors.marker.color }}
            className="rounded-full w-3 h-3"
          />
          <Label>{markersDataSource?.name || "Markers"}</Label>
        </div>
        <MarkerList
          dataSource={markersDataSource}
          onSelect={(coordinates: [number, number]) => {
            const map = mapRef.current;
            if (map) {
              map.flyTo({
                center: coordinates,
                zoom: 12,
              });
            }
          }}
        />
      </div>
    </>
  );
}
