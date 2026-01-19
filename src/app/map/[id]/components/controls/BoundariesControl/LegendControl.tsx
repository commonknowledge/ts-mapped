import Legend from "@/app/map/[id]/components/Legend";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useBoundariesControl } from "./useBoundariesControl";

export default function LegendControl() {
  const { viewConfig } = useMapViews();
  const { hasShape } = useBoundariesControl();

  return (
    <div
      className={`space-y-1 ${!hasShape ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div
        className={`flex items-center bg-white group relative ${viewConfig.showChoropleth ? "" : "opacity-50"}`}
      >
        <Legend />
      </div>
    </div>
  );
}
