import TurfHistory from "../dataLists/TurfHistory";
import { mapColors } from "@/app/(private)/map/styles";
import { MapRef } from "react-map-gl/mapbox";
import { DrawnPolygon } from "@/types";
import SkeletonGroup from "../SkeletonGroup";
import LayerHeader from "./LayerHeader";

interface TurfControlProps {
  turfHistory: DrawnPolygon[];
  mapRef: React.RefObject<MapRef | null>;
  setTurfHistory: React.Dispatch<React.SetStateAction<DrawnPolygon[]>>;
  isLoading?: boolean;
  showTurf: boolean;
  setShowTurf: (showTurf: boolean) => void;
}

export default function TurfControl({
  turfHistory,
  mapRef,
  setTurfHistory,
  isLoading = false,
  showTurf,
  setShowTurf,
}: TurfControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Turf"
        color={mapColors.turf.color}
        showLayer={showTurf}
        setLayer={setShowTurf}
      />
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <TurfHistory
          polygons={turfHistory}
          showTurf={showTurf}
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
