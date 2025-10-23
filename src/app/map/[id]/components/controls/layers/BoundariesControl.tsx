import { useState } from "react";
import LayerHeader from "../LayerHeader";
import { ChevronDown, Eye, Hexagon, Palette } from "lucide-react";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { AreaSetGroupCodeLabels } from "@/labels";
import { VisualisationType } from "@/server/models/MapView";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";

export default function BoundariesControl() {
  const { viewConfig } = useMapViews();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-1 p-3">
      <LayerHeader
        label="Boundaries"
        showLayer={true}
        expanded={expanded}
        setExpanded={setExpanded}
      />

      {expanded && (
        <div className="relative">
          {/* SHAPE Section */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Hexagon className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium">SHAPE</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white rounded border">
              <Eye className="w-4 h-4 text-neutral-600" />
              <div className="flex-1">
                <div className="text-sm">
                  {viewConfig.areaSetGroupCode
                    ? AreaSetGroupCodeLabels[
                        viewConfig.areaSetGroupCode as AreaSetGroupCode
                      ]
                    : "No Locality"}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* FILL Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium">FILL</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white rounded border mb-2">
              <Eye className="w-4 h-4 text-neutral-600" />
              <div className="flex-1">
                <div className="text-sm">
                  {viewConfig.visualisationType ===
                    VisualisationType.Choropleth && viewConfig.areaDataSourceId
                    ? "Data Visualization"
                    : "No Fill"}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
