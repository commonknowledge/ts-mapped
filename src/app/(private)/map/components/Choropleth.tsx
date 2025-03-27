import { Layer, Source } from "react-map-gl/mapbox";
import { AreaStats } from "@/__generated__/types";
import { useFillColor } from "@/app/(private)/map/colors";
import { ChoroplethLayerConfig } from "@/app/(private)/map/sources";

export default function Choropleth({
  areaStats,
  choroplethLayerConfig: {
    mapbox: { featureCodeProperty, featureNameProperty, layerId, sourceId },
  },
}: {
  areaStats: AreaStats | undefined;
  choroplethLayerConfig: ChoroplethLayerConfig;
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
          "line-color": "#000",
          "line-width": 2,
        }}
      />

      {/* Symbol Layer (Labels) */}
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
        }}
        paint={{
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
}
