import { Layer } from "react-map-gl/mapbox";

const NOT_MATCHED_CASE = [
  "any",
  ["!", ["get", "matched"]],
  ["==", ["get", "__clientExcluded"], true],
];

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
      <Layer
        id={`${sourceId}-pins`}
        type="circle"
        source={sourceId}
        filter={[
          "any",
          ["!", ["has", "point_count"]],
          ["==", ["get", "point_count"], 1],
        ]}
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 16, 8],
          "circle-color": color,
          "circle-opacity": ["case", NOT_MATCHED_CASE, 0.5, 1],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        }}
      />
      <Layer
        id={`${sourceId}-labels`}
        type="symbol"
        source={sourceId}
        filter={[
          "any",
          ["!", ["has", "point_count"]],
          ["==", ["get", "point_count"], 1],
        ]}
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
