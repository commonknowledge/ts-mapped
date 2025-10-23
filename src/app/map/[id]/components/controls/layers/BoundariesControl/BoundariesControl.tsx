import { SettingsIcon } from "lucide-react";
import { useContext, useState } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Separator } from "@/shadcn/ui/separator";
import LayerHeader from "../../LayerHeader";
import { FillSelector } from "./FillSelector";
import { LegendControl } from "./LegendControl";
import { ShapeSelector } from "./ShapeSelector";
import { useBoundariesControl } from "./useBoundariesControl";

export default function BoundariesControl() {
  const [expanded, setExpanded] = useState(true);
  const { hasDataSource } = useBoundariesControl();
  const { boundariesPanelOpen, setBoundariesPanelOpen } =
    useContext(ChoroplethContext);

  return (
    <div className="flex flex-col gap-1 p-3">
      <LayerHeader
        label="Boundaries"
        showLayer={true}
        expanded={expanded}
        setExpanded={setExpanded}
      >
        <IconButtonWithTooltip
          tooltip="Open advanced settings"
          onClick={() => setBoundariesPanelOpen(!boundariesPanelOpen)}
        >
          <SettingsIcon size={16} />
        </IconButtonWithTooltip>
      </LayerHeader>
      {expanded && (
        <div className="space-y-2 py-2">
          <ShapeSelector />
          <Separator />
          <FillSelector />
          {hasDataSource && <LegendControl />}
        </div>
      )}
    </div>
  );
}
