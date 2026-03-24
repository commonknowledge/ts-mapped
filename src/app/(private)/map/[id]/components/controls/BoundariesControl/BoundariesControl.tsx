import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useChoropleth } from "@/app/(private)/map/[id]/hooks/useChoropleth";
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
        enableVisibilityToggle={hasDataSource}
      >
        {hasDataSource && (
          <IconButtonWithTooltip
            tooltip={
              boundariesPanelOpen ? "Close style settings" : "Open style settings"
            }
            onClick={() => setBoundariesPanelOpen(!boundariesPanelOpen)}
          >
            <SettingsIcon size={16} />
          </IconButtonWithTooltip>
        )}
      </LayerHeader>

      {expanded && (
        <div className="px-4 pt-2 pb-3 space-y-2">
          <LegendControl />
        </div>
      )}
    </LayerControlWrapper>
  );
}
