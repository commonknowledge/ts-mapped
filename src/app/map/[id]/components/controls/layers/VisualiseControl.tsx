import { ChevronDown, Eye, Grid3X3, Hexagon, Palette } from "lucide-react";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { AreaSetGroupCodeLabels } from "@/labels";
import { VisualisationType } from "@/server/models/MapView";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";

export default function VisualiseControl() {
  const { viewConfig } = useMapViews();

  return (
    <div className="bg-neutral-50 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Grid3X3 className="w-4 h-4 text-neutral-600" />
        <span className="text-sm font-medium">Boundaries</span>
      </div>

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
              {viewConfig.visualisationType === VisualisationType.Choropleth &&
              viewConfig.areaDataSourceId
                ? "Data Visualization"
                : "No Fill"}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        </div>

        {/* Color gradient bar - only show if there's actual visualization data */}
        {viewConfig.visualisationType === VisualisationType.Choropleth &&
          viewConfig.areaDataSourceId && (
            <div className="bg-white rounded border p-2">
              <div className="h-2 bg-gradient-to-r from-orange-400 to-purple-600 rounded mb-1"></div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>0</span>
                <span>3%</span>
                <span>6%</span>
                <span>8%</span>
                <span>11%</span>
                <span>14%</span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
