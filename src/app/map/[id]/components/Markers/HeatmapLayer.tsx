import { Layer } from "react-map-gl/mapbox";
import { rgbaString } from "./utils";

const NOT_MATCHED_CASE = [
  "any",
  ["!", ["get", "matched"]],
  ["==", ["get", "__clientExcluded"], true],
];

export function HeatmapLayer({
  sourceId,
  color,
}: {
  sourceId: string;
  color: string;
}) {
  return (
    <>
      <Layer
        id={`${sourceId}-heatmap`}
        key={`${sourceId}-heatmap`}
        type="heatmap"
        source={sourceId}
        paint={{
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["case", ["has", "point_count"], ["get", "point_count"], 1],
            1,
            ["case", NOT_MATCHED_CASE, 0.2, 0.4],
            10,
            ["case", NOT_MATCHED_CASE, 0.6, 1.1],
            50,
            ["case", NOT_MATCHED_CASE, 0.65, 1.15],
            100,
            ["case", NOT_MATCHED_CASE, 0.7, 1.2],
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            15,
            3,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            rgbaString(color, 0),
            0.2,
            rgbaString(color, 0.2),
            0.4,
            rgbaString(color, 0.4),
            0.6,
            rgbaString(color, 0.6),
            0.8,
            rgbaString(color, 0.8),
            1,
            rgbaString(color, 1),
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            15,
            15,
            80,
          ],
          "heatmap-opacity": 0.7,
        }}
      />
      <Layer
        id={`${sourceId}-pins`}
        type="circle"
        source={sourceId}
        minzoom={10}
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 16, 8],
          "circle-color": color,
          "circle-opacity": ["case", NOT_MATCHED_CASE, 0.5, 0.8],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        }}
      />
      <Layer
        id={`${sourceId}-labels`}
        type="symbol"
        source={sourceId}
        minzoom={10}
        layout={{
          "text-field": [
            "concat",
            ["slice", ["get", "name"], 0, 20],
            ["case", [">", ["length", ["get", "name"]], 20], "...", ""],
          ],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-transform": "uppercase",
          "text-offset": [0, -1.25],
        }}
        paint={{
          "text-color": color,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        }}
      />
    </>
  );
}
