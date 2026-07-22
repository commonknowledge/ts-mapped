import { Layer } from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";

const NOT_MATCHED_CASE = [
  "any",
  ["!", ["get", "matched"]],
  ["==", ["get", "__clientExcluded"], true],
] as const;

export interface MarkerPinStyle {
  useIcons: boolean;
  iconImage?: string | ExpressionSpecification;
  color: string | ExpressionSpecification;
  sizeFactor: number | ExpressionSpecification;
  sortKey: number | ExpressionSpecification;
  opacity: number;
  showLabels: boolean;
}

/**
 * Individual marker pins and their labels, shared by every display mode.
 * Pins honour the full pinStyle (icon shapes, category colours, scaled
 * sizes); the display modes differ only in how they aggregate at low zoom
 * and in the props they pass here.
 */
export function PinsLayer({
  sourceId,
  color,
  pinStyle,
  filter,
  minzoom = 0,
  overdraw = false,
}: {
  sourceId: string;
  color: string;
  pinStyle?: MarkerPinStyle;
  /** Layer filter, e.g. to hide points absorbed into clusters */
  filter?: ExpressionSpecification;
  /** Hide pins below this zoom (heatmap shows pins at high zoom only).
   *  Always applied as a number: mapbox's setLayerZoomRange ignores
   *  undefined, so a mode change must pass 0 to clear a previous minzoom. */
  minzoom?: number;
  /** Overlap styling: semi-transparent strokeless dots so density reads
   *  through overdraw */
  overdraw?: boolean;
}) {
  const pinColor = pinStyle?.color ?? color;
  const sizeFactor = pinStyle?.sizeFactor ?? 1;
  const opacity = pinStyle?.opacity ?? 1;
  const showLabels = pinStyle?.showLabels ?? true;

  const pinOpacity: ExpressionSpecification = [
    "*",
    [
      "case",
      NOT_MATCHED_CASE as unknown as ExpressionSpecification,
      overdraw ? 0.3 : 0.5,
      overdraw ? 0.65 : 1,
    ],
    opacity,
  ];

  const layerProps = {
    source: sourceId,
    ...(filter ? { filter } : {}),
    minzoom,
  };

  return (
    <>
      {pinStyle?.useIcons && pinStyle.iconImage ? (
        <Layer
          // Keyed by layer type: react-map-gl cannot change a layer's type in
          // place, so switching circle <-> symbol must remount the component
          key={`${sourceId}-pins-symbol`}
          id={`${sourceId}-pins`}
          type="symbol"
          {...layerProps}
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
          {...layerProps}
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
            "circle-stroke-width": overdraw ? 0 : 1,
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
          {...(filter ? { filter } : {})}
          minzoom={Math.max(minzoom, 10)}
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
