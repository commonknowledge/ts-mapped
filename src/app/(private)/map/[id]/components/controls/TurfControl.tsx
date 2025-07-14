import { PlusIcon } from "lucide-react";
import { useContext } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColours } from "@/app/(private)/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import TurfHistory from "../lists/TurfList";
import LayerHeader from "./LayerHeader";

export default function TurfControl() {
  const { viewConfig, mapRef, updateViewConfig } = useContext(MapContext);
  return (
    <div className="flex flex-col gap-1 px-4 pb-4">
      <LayerHeader
        label="Areas"
        color={mapColours.areas.color}
        showLayer={viewConfig.showTurf}
        setLayer={(show) => updateViewConfig({ showTurf: show })}
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
