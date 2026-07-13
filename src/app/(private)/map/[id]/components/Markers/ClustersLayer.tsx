import { Layer } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";

const NOT_MATCHED_CASE = [
  "any",
  ["!", ["get", "matched"]],
  ["==", ["get", "__clientExcluded"], true],
] as const;

const UNCLUSTERED_FILTER: ExpressionSpecification = [
  "any",
  ["!", ["has", "point_count"]],
  ["==", ["get", "point_count"], 1],
];

export interface MarkerPinStyle {
  useIcons: boolean;
  iconImage?: string | ExpressionSpecification;
  color: string | ExpressionSpecification;
  sizeFactor: number | ExpressionSpecification;
  sortKey: number | ExpressionSpecification;
  opacity: number;
  showLabels: boolean;
}

export function ClustersLayer({
  sourceId,
  color,
  pinStyle,
}: {
  sourceId: string;
  color: string;
  pinStyle?: MarkerPinStyle;
}) {
  const pinColor = pinStyle?.color ?? color;
  const sizeFactor = pinStyle?.sizeFactor ?? 1;
  const opacity = pinStyle?.opacity ?? 1;
  const showLabels = pinStyle?.showLabels ?? true;

  const pinOpacity: ExpressionSpecification = [
    "*",
    ["case", NOT_MATCHED_CASE as unknown as ExpressionSpecification, 0.5, 1],
    opacity,
  ];

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
      {pinStyle?.useIcons && pinStyle.iconImage ? (
        <Layer
          // Keyed by layer type: react-map-gl cannot change a layer's type in
          // place, so switching circle <-> symbol must remount the component
          key={`${sourceId}-pins-symbol`}
          id={`${sourceId}-pins`}
          type="symbol"
          source={sourceId}
          filter={UNCLUSTERED_FILTER}
          layout={{
            "icon-image": pinStyle.iconImage,
            // Sprite images are 64px; scale to pin-like sizes by zoom,
            // multiplied by the per-value ordinal size factor
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8,
              ["*", 0.14, sizeFactor],
              16,
              ["*", 0.32, sizeFactor],
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "symbol-sort-key": pinStyle.sortKey,
          }}
          paint={{
            "icon-color": pinColor,
            "icon-opacity": pinOpacity,
            "icon-halo-color": "#ffffff",
            "icon-halo-width": 1,
          }}
        />
      ) : (
        <Layer
          key={`${sourceId}-pins-circle`}
          id={`${sourceId}-pins`}
          type="circle"
          source={sourceId}
          filter={UNCLUSTERED_FILTER}
          layout={{
            "circle-sort-key": pinStyle?.sortKey ?? 0,
          }}
          paint={{
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8,
              ["*", 3, sizeFactor],
              16,
              ["*", 8, sizeFactor],
            ],
            "circle-color": pinColor,
            "circle-opacity": pinOpacity,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-opacity": opacity,
          }}
        />
      )}
      {showLabels && (
        <Layer
          id={`${sourceId}-labels`}
          type="symbol"
          source={sourceId}
          filter={UNCLUSTERED_FILTER}
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
