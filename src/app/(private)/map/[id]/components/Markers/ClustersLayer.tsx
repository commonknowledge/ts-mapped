import { Layer } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";

export const UNCLUSTERED_FILTER: ExpressionSpecification = [
  "any",
  ["!", ["has", "point_count"]],
  ["==", ["get", "point_count"], 1],
];

/**
 * Cluster circles and their point counts. Individual (unclustered) pins are
 * rendered separately by PinsLayer with the UNCLUSTERED_FILTER.
 */
export function ClustersLayer({
  sourceId,
  color,
}: {
  sourceId: string;
  color: string;
}) {
  return (
    <>
      <Layer
        id={`${sourceId}-circles`}
        key={`${sourceId}-circles`}
        type="circle"
        source={sourceId}
        filter={["has", "point_count"]}
        paint={{
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            1,
            15,
            10,
            25,
            100,
            35,
            1000,
            50,
            10000,
            70,
          ],
          "circle-color": color,
          "circle-opacity": [
            "case",
            ["==", ["get", "matched_count"], 0],
            0.5,
            0.8,
          ],
        }}
      />
      <Layer
        id={`${sourceId}-counts`}
        key={`${sourceId}-counts`}
        type="symbol"
        source={sourceId}
        filter={["has", "point_count"]}
        layout={{
          "text-field": ["get", "point_count"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        }}
      />
    </>
  );
}
