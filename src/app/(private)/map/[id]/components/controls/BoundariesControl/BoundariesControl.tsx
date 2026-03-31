import { PaintbrushIcon } from "lucide-react";
import { useState } from "react";
import { useChoropleth } from "@/app/(private)/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { DEFAULT_CALCULATION_TYPE } from "@/models/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";
import { LayerType } from "@/types";
import Legend from "../../Legend/Legend";
import LayerControlWrapper from "../LayerControlWrapper";
import LayerHeader from "../LayerHeader";
import { useBoundariesControl } from "./useBoundariesControl";

export default function BoundariesControl() {
  const [expanded, setExpanded] = useState(true);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const { hasDataSource } = useBoundariesControl();
  const { boundariesPanelOpen, setBoundariesPanelOpen } = useChoropleth();
  const { updateViewConfig } = useMapViews();

  const handleClear = () => {
    updateViewConfig({
      areaDataSourceId: "",
      areaDataColumn: "",
      areaDataSecondaryColumn: undefined,
      calculationType: DEFAULT_CALCULATION_TYPE,
      includeColumnsString: undefined,
      colorScheme: null,
      colorScaleType: undefined,
      reverseColorScheme: null,
      customColor: undefined,
      steppedColorStepsByKey: undefined,
    });
    setBoundariesPanelOpen(false);
    setConfirmClearOpen(false);
  };

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
              boundariesPanelOpen
                ? "Close style settings"
                : "Open style settings"
            }
            onClick={() => setBoundariesPanelOpen(!boundariesPanelOpen)}
          >
            <PaintbrushIcon size={16} />
          </IconButtonWithTooltip>
        )}
      </LayerHeader>

      {expanded && (
        <div className="px-4 pt-2 pb-3 space-y-2">
          <Legend onClearRequest={() => setConfirmClearOpen(true)} />
        </div>
      )}

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear data visualisation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the visualisation data and style settings for the
              current view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>Clear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayerControlWrapper>
  );
}
