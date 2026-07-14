import { Layer } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";

const NOT_MATCHED_CASE = [
  "any",
  ["!", ["get", "matched"]],
  ["==", ["get", "__clientExcluded"], true],
] as const;

/**
 * Overlap display mode: uniform small single-colour circles with no
 * clustering and no stroke, so dense areas read as darker blobs through
 * overdraw. Category colours are intentionally ignored — the effect works
 * best in one colour.
 */
export function OverlapLayer({
  sourceId,
  color,
  opacity = 1,
  showLabels = true,
}: {
  sourceId: string;
  color: string;
  opacity?: number;
  showLabels?: boolean;
}) {
  const circleOpacity: ExpressionSpecification = [
    "*",
    ["case", NOT_MATCHED_CASE as unknown as ExpressionSpecification, 0.3, 0.65],
    opacity,
  ];

  return (
    <>
      <Layer
        id={`${sourceId}-pins`}
        key={`${sourceId}-pins-overlap`}
        type="circle"
        source={sourceId}
        paint={{
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            3,
            10,
            5,
            16,
            8,
          ],
          "circle-color": color,
          "circle-opacity": circleOpacity,
        }}
      />
      {showLabels && (
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
      )}
    </>
  );
}
