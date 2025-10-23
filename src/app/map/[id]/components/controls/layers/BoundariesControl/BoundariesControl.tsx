import { useState } from "react";
import { Separator } from "@/shadcn/ui/separator";
import LayerHeader from "../../LayerHeader";
import { FillSelector } from "./FillSelector";
import { LegendControl } from "./LegendControl";
import { ShapeSelector } from "./ShapeSelector";
import { useBoundariesControl } from "./useBoundariesControl";

export default function BoundariesControl() {
  const [expanded, setExpanded] = useState(true);

  const {
    viewConfig,
    updateViewConfig,
    isChoroplethVisible,
    toggleChoropleth,
    fillLabel,
    shapeOptions,
    fillOptions,
    colorSchemeOptions,
    hasShape,
    hasDataSource,
  } = useBoundariesControl();

  return (
    <div className="flex flex-col gap-1 p-3">
      <LayerHeader
        label="Boundaries"
        showLayer={true}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      {expanded && (
        <div className="space-y-2 py-2">
          <ShapeSelector
            selectedShape={viewConfig.areaSetGroupCode}
            shapeOptions={shapeOptions}
          />

          <Separator />

          <FillSelector
            disabled={!hasShape}
            fillLabel={fillLabel}
            isChoroplethVisible={isChoroplethVisible}
            areaDataSourceId={viewConfig.areaDataSourceId}
            calculationType={viewConfig.calculationType}
            baseOptions={fillOptions.baseOptions}
            voteShareOptions={fillOptions.voteShareOptions}
          />

          {hasDataSource && (
            <LegendControl
              disabled={!hasShape}
              isChoroplethVisible={isChoroplethVisible}
              visualisationType={viewConfig.visualisationType}
              reverseColorScheme={Boolean(viewConfig.reverseColorScheme)}
              colorSchemeOptions={colorSchemeOptions}
              onToggleChoropleth={toggleChoropleth}
              onUpdateColorScheme={(colorScheme) =>
                updateViewConfig({ colorScheme })
              }
              onToggleReverse={(checked) =>
                updateViewConfig({ reverseColorScheme: checked })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
