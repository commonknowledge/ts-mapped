import { PlusIcon } from "lucide-react";
import { useContext } from "react";
import { MapContext } from "@/app/(private)/map/context/MapContext";
import { mapColors } from "@/app/(private)/map/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import TurfHistory from "../lists/TurfList";
import LayerHeader from "./LayerHeader";

export default function TurfControl() {
  const { mapConfig, mapRef, updateMapConfig } = useContext(MapContext);
  return (
    <div className="flex flex-col gap-1">
      <LayerHeader
        label="Turf"
        color={mapColors.turf.color}
        showLayer={mapConfig.showTurf}
        setLayer={() => updateMapConfig({ showTurf: true })}
      >
        <IconButtonWithTooltip
          tooltip="Add Turf"
          onClick={() => {
            const map = mapRef?.current;
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
      <TurfHistory />
    </div>
  );
}
