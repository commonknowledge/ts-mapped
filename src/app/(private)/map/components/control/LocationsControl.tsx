import SearchHistory from "../dataLists/SearchHistory";
import { Label } from "@/shadcn/ui/label";
import { mapColors } from "@/app/(private)/map/styles";
import { MapRef } from "react-map-gl/mapbox";
import { SearchResult } from "@/types";
import SkeletonGroup from "../SkeletonGroup";
import LayerVisibilityToggle from "./LayerVisibilityToggle";
import LayerHeader from "./LayerHeader";
import { PlusIcon } from "lucide-react";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
interface LocationsControlProps {
  searchHistory: SearchResult[];
  mapRef: React.RefObject<MapRef | null>;
  onEdit: (index: number, newText: string) => void;
  onDelete: (index: number) => void;
  isLoading?: boolean;
  showLocations: boolean;
  setShowLocations: (showLocations: boolean) => void;
}

export default function LocationsControl({
  searchHistory,
  mapRef,
  onEdit,
  onDelete,
  isLoading = false,
  showLocations,
  setShowLocations,
}: LocationsControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Locations"
        color={mapColors.searched.color}
        showLayer={showLocations}
        setLayer={setShowLocations}
      >
        <IconButtonWithTooltip
          tooltip="Add Location"
          onClick={() => {
            // Find the geocoder input element and focus it
            const geocoderInput = document.querySelector(
              ".mapboxgl-ctrl-geocoder--input"
            ) as HTMLInputElement;
            if (geocoderInput) {
              geocoderInput.focus();
            }
          }}
        >
          <PlusIcon className="w-4 h-4" />
        </IconButtonWithTooltip>
      </LayerHeader>
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
          showLocations={showLocations}
        />
      )}
    </div>
  );
}
