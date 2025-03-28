import TurfHistory from "../dataLists/TurfHistory";
import { Label } from "@/shadcn/components/ui/label";
import { mapColors } from "@/app/(private)/map/styles";
import { MapRef } from "react-map-gl/mapbox";
import { DrawnPolygon } from "@/types";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import SkeletonGroup from "../SkeletonGroup";

interface TurfControlProps {
  turfHistory: DrawnPolygon[];
  mapRef: React.RefObject<MapRef | null>;
  setTurfHistory: React.Dispatch<React.SetStateAction<DrawnPolygon[]>>;
  isLoading?: boolean;
}

export default function TurfControl({
  turfHistory,
  mapRef,
  setTurfHistory,
  isLoading = false,
}: TurfControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row gap-2 items-center mb-2">
        <div
          style={{ backgroundColor: mapColors.turf.color }}
          className="rounded-full w-3 h-3"
        />
        <Label>Turf</Label>
      </div>
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <TurfHistory
          polygons={turfHistory}
          onSelect={(coordinates) => {
            const map = mapRef.current;
            if (map) {
              map.flyTo({
                center: coordinates,
                zoom: 12,
              });
            }
          }}
          onEdit={(index, newName) => {
            setTurfHistory((prev) =>
              prev.map((poly, i) =>
                i === index ? { ...poly, name: newName } : poly
              )
            );
          }}
          onDelete={(index) => {
            setTurfHistory((prev) => prev.filter((_, i) => i !== index));
          }}
        />
      )}
    </div>
  );
}
