import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { LayerType } from "@/types";
import LayerControlWrapper from "../LayerControlWrapper";
import LayerHeader from "../LayerHeader";
import LegendControl from "./LegendControl";
import { useBoundariesControl } from "./useBoundariesControl";

export default function BoundariesControl() {
  const [expanded, setExpanded] = useState(true);
  const { hasDataSource } = useBoundariesControl();
  const { boundariesPanelOpen, setBoundariesPanelOpen } = useChoropleth();

  return (
    <LayerControlWrapper>
      <LayerHeader
        label="Data visualisation"
        type={LayerType.Boundary}
        expanded={expanded}
        setExpanded={setExpanded}
      >
        <IconButtonWithTooltip
          tooltip={
            boundariesPanelOpen ? "Close settings" : "Open advanced settings"
          }
          onClick={() => setBoundariesPanelOpen(!boundariesPanelOpen)}
        >
          <SettingsIcon size={16} />
        </IconButtonWithTooltip>
      </LayerHeader>

      {expanded && (
        <div className="space-y-2 py-2">
          {/* Controls removed from here 2025-12-08. */}
          {/* Potentially could be restored. Remove if still not restored by 2025-03-01 */}
          {/* <ShapeSelector />
          <Separator />
          <FillSelector /> */}
          {hasDataSource && <LegendControl />}
        </div>
      )}
    </LayerControlWrapper>
  );
}
