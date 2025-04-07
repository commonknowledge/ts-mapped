import { PlusIcon } from "lucide-react";
import { MapRef } from "react-map-gl/mapbox";
import { mapColors } from "@/app/(private)/map/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DrawnPolygon } from "@/types";
import TurfHistory from "../dataLists/TurfList";
import SkeletonGroup from "../SkeletonGroup";
import LayerHeader from "./LayerHeader";

interface TurfControlProps {
  turfHistory: DrawnPolygon[];
  mapRef: React.RefObject<MapRef | null>;
  setTurfHistory: React.Dispatch<React.SetStateAction<DrawnPolygon[]>>;
  isLoading?: boolean;
  showTurf: boolean;
  setShowTurf: (showTurf: boolean) => void;
  setEditingPolygon: (polygon: DrawnPolygon | null) => void;
}

export default function TurfControl({
  turfHistory,
  mapRef,
  setTurfHistory,
  isLoading = false,
  showTurf,
  setShowTurf,
  setEditingPolygon,
}: TurfControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Turf"
        color={mapColors.turf.color}
        showLayer={showTurf}
        setLayer={setShowTurf}
      >
        <IconButtonWithTooltip
          tooltip="Add Turf"
          onClick={() => {
            const map = mapRef.current;
            if (map) {
              // Find the polygon draw button and click it
              const drawButton = document.querySelector(
                ".mapbox-gl-draw_polygon",
              ) as HTMLButtonElement;
              if (drawButton) {
                drawButton.click();
              }
            }
          }}
        >
          <PlusIcon className="w-4 h-4" />
        </IconButtonWithTooltip>
      </LayerHeader>
      {isLoading ? (
        <SkeletonGroup />
      ) : (
        <TurfHistory
          polygons={turfHistory}
          setEditingPolygon={setEditingPolygon}
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
                i === index ? { ...poly, name: newName } : poly,
              ),
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
