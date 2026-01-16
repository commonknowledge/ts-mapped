import { useFillColor } from "@/app/map/[id]/colors";
import { useAreaStats } from "@/app/map/[id]/data";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { ColorScheme } from "@/server/models/MapView";

export function useChoroplethAreaStats() {
  const { selectedBivariateBucket } = useChoropleth();

  const { viewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;

  // Get fill color
  const fillColor = useFillColor({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isReversed: Boolean(viewConfig.reverseColorScheme),
    selectedBivariateBucket,
    categoryColors: viewConfig.categoryColors,
    colorScaleType: viewConfig.colorScaleType,
    steppedColorSteps: viewConfig.steppedColorSteps,
    customColor: viewConfig.customColor,
  });

  return fillColor;
}
