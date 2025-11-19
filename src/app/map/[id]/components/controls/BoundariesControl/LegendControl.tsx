import { Eye } from "lucide-react";
import Legend from "@/app/map/[id]/components/Legend";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useBoundariesControl } from "./useBoundariesControl";

export function LegendControl() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const { hasShape } = useBoundariesControl();

  const toggleChoropleth = () => {
    updateViewConfig({ showChoropleth: !viewConfig.showChoropleth });
  };

  return (
    <div
      className={`space-y-1 ${!hasShape ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div
        className={`flex items-center bg-white group relative ${viewConfig.showChoropleth ? "" : "opacity-50"}`}
      >
        <button
          className="bg-neutral-100 hover:bg-neutral-200 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-2 cursor-pointer"
          onClick={toggleChoropleth}
          disabled={!hasShape}
        >
          <Eye
            className={`w-4 h-4 ${viewConfig.calculationType ? "text-neutral-500" : "text-neutral-400"}`}
          />
        </button>
        <Legend />
      </div>
    </div>
  );
}
