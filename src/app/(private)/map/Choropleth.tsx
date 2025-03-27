import { scaleLinear, scaleSequential } from "d3-scale";
import { interpolateOrRd } from "d3-scale-chromatic";
import { Layer, Source } from "react-map-gl/mapbox";
import { AreaStat } from "@/__generated__/types";
import { ChoroplethLayerConfig } from "./sources";

export default function Choropleth({
  areaStats,
  choroplethLayerConfig: {
    mapbox: { featureCodeProperty, featureNameProperty, layerId, sourceId },
  },
}: {
  areaStats: AreaStat[] | undefined;
  choroplethLayerConfig: ChoroplethLayerConfig;
}) {
  const getColorStops = (areaStats: AreaStat[] | undefined) => {
    const defaultStops = [0, "rgba(0, 0, 0, 0)"];
    if (!areaStats) {
      return defaultStops;
    }

    const values = areaStats.map((stat) => stat.value);
    let minValue = null;
    let maxValue = null;
    for (const v of values) {
      if (minValue === null || v < minValue) {
        minValue = v;
      }
      if (maxValue === null || v > maxValue) {
        maxValue = v;
      }
    }

    if (minValue === maxValue) {
      return defaultStops;
    }

    const numSteps = 30;
    const stepScale = scaleLinear()
      .domain([0, numSteps - 1])
      .range([minValue, maxValue]);

    const colorScale = scaleSequential()
      .domain([minValue, maxValue])
      .interpolator(interpolateOrRd);

    return new Array(numSteps).fill(null).flatMap((_, i) => {
      const step = stepScale(i);
      return [step, colorScale(step)];
    });
  };
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
          "fill-color": [
            "interpolate",
            ["linear"],
            ["to-number", ["feature-state", "value"], 0],
            ...getColorStops(areaStats),
          ],
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
