import { Layer } from "react-map-gl/mapbox";

const NOT_MATCHED_CASE = [
  "any",
  ["!", ["get", "matched"]],
  ["==", ["get", "__clientExcluded"], true],
];

/**
 * Density heatmap with a fixed green→red ramp; marker colours do not apply
 * to the ramp. Individual pins at high zoom are rendered by PinsLayer.
 */
export function HeatmapLayer({
  sourceId,
  opacity = 1,
}: {
  sourceId: string;
  opacity?: number;
}) {
  return (
    <Layer
      id={`${sourceId}-heatmap`}
      key={`${sourceId}-heatmap`}
      type="heatmap"
      source={sourceId}
      paint={{
        // Uniform weight per record (pure point density); weighted
        // heatmaps proved unbalanceable. Unmatched records contribute less.
        "heatmap-weight": ["case", NOT_MATCHED_CASE, 0.3, 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
        // Fixed green→red density ramp; heatmaps ignore the marker colour
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(34, 197, 94, 0)",
          0.2,
          "rgba(34, 197, 94, 0.6)",
          0.4,
          "rgba(163, 230, 53, 0.7)",
          0.6,
          "rgba(250, 204, 21, 0.8)",
          0.8,
          "rgba(249, 115, 22, 0.9)",
          1,
          "rgba(239, 68, 68, 1)",
        ],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 15, 80],
        "heatmap-opacity": 0.7 * opacity,
      }}
    />
  );
}
