import { PlusIcon } from "lucide-react";
import { useContext } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { mapColours } from "@/app/(private)/map/[id]/styles";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import TurfHistory from "../lists/TurfList";
import LayerHeader from "./LayerHeader";

export default function TurfControl() {
  const { viewConfig, draw, setAddingLayer, updateViewConfig } =
    useContext(MapContext);
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
            if (draw && typeof draw.changeMode === "function") {
              draw.changeMode("draw_polygon");
              setAddingLayer("area");
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
