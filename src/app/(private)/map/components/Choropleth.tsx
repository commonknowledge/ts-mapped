import { Layer, Source } from "react-map-gl/mapbox";
import { AreaStats } from "@/__generated__/types";
import { useFillColor } from "@/app/(private)/map/colors";
import { ChoroplethLayerConfig } from "@/app/(private)/map/sources";
import { MapConfig } from "./Controls";

export default function Choropleth({
  areaStats,
  choroplethLayerConfig: {
    mapbox: { featureCodeProperty, featureNameProperty, layerId, sourceId },
  },
  mapConfig,
}: {
  areaStats: AreaStats | undefined;
  choroplethLayerConfig: ChoroplethLayerConfig;
  mapConfig: MapConfig;
}) {
  const fillColor = useFillColor(areaStats);
  return (
    <Source
      id={sourceId}
      key={layerId}
      promoteId={featureCodeProperty}
      type="vector"
      url={`mapbox://${sourceId}`}
    >
      {/* Fill Layer */}
      <Layer
        id={`${sourceId}-fill`}
        source={sourceId}
        source-layer={layerId}
        type="fill"
        paint={{
          "fill-color": fillColor,
          "fill-opacity": 0.5,
        }}
      />

      {/* Line Layer */}
      <Layer
        id={`${sourceId}-line`}
        source={sourceId}
        source-layer={layerId}
        type="line"
        paint={{
          "line-color": "#999",
          "line-width": 1,
        }}
      />

      {/* Symbol Layer (Labels) */}
      {mapConfig.showLabels && (
      <Layer
        id={`${sourceId}-labels`}
        source={sourceId}
        source-layer={layerId}
        type="symbol"
        layout={{
          "symbol-placement": "point",
          "text-field": ["get", featureNameProperty],
          "text-size": 14,
          "text-anchor": "center",
          "text-allow-overlap": false,
          "symbol-spacing": 100,
          "text-max-width": 8,
          "text-padding": 30,
          "text-transform": "uppercase",
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        }}
        paint={{
          "text-color": mapConfig.mapStyle.textColor,
          "text-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0.8,
            10, 0.8
          ],
          "text-halo-color": mapConfig.mapStyle.textHaloColor,
            "text-halo-width": 1.5,
          }}
        />
      )}
    </Source>
  );
}
