import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { usePrivateMapStore } from "@/app/map/[id]/stores/usePrivateMapStore";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Separator } from "@/shadcn/ui/separator";
import { LayerType } from "@/types";
import LayerControlWrapper from "../LayerControlWrapper";
import LayerHeader from "../LayerHeader";
import { FillSelector } from "./FillSelector";
import { LegendControl } from "./LegendControl";
import { ShapeSelector } from "./ShapeSelector";
import { useBoundariesControl } from "./useBoundariesControl";

export default function BoundariesControl() {
  const [expanded, setExpanded] = useState(true);
  const { hasDataSource } = useBoundariesControl();
  const boundariesPanelOpen = usePrivateMapStore((s) => s.boundariesPanelOpen);
  const setBoundariesPanelOpen = usePrivateMapStore(
    (s) => s.setBoundariesPanelOpen,
  );

  return (
    <LayerControlWrapper>
      <LayerHeader
        label="Boundaries"
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
          <ShapeSelector />
          <Separator />
          <FillSelector />
          {hasDataSource && <LegendControl />}
        </div>
      )}
    </LayerControlWrapper>
  );
}
