import SearchHistory from "../dataLists/SearchHistory";
import { Label } from "@/shadcn/components/ui/label";
import { mapColors } from "@/app/(private)/map/styles";
import { MapRef } from "react-map-gl/mapbox";
import { SearchResult } from "@/types";
import SkeletonGroup from "../SkeletonGroup";

interface LocationsControlProps {
  searchHistory: SearchResult[];
  mapRef: React.RefObject<MapRef | null>;
  onEdit: (index: number, newText: string) => void;
  onDelete: (index: number) => void;
  isLoading?: boolean;
}

export default function LocationsControl({
  searchHistory,
  mapRef,
  onEdit,
  onDelete,
  isLoading = false,
}: LocationsControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row gap-2 items-center mb-2">
        <div
          style={{ backgroundColor: mapColors.searched.color }}
          className="rounded-full w-3 h-3"
        />
        <Label>Locations</Label>
      </div>
      {isLoading ? (
        <SkeletonGroup />
      ) : (
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
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
