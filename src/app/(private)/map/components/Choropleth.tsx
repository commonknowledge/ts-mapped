import { scaleLinear, scaleOrdinal, scaleSequential } from "d3-scale";
import { interpolateOrRd, schemeCategory10 } from "d3-scale-chromatic";
import { DataDrivenPropertyValueSpecification } from "mapbox-gl";
import { Layer, Source } from "react-map-gl/mapbox";
import { AreaStat, ColumnType } from "@/__generated__/types";
import { ChoroplethLayerConfig } from "@/app/(private)/map/sources";

export default function Choropleth({
  areaStats,
  choroplethLayerConfig: {
    mapbox: { featureCodeProperty, featureNameProperty, layerId, sourceId },
  },
}: {
  areaStats: { columnType: ColumnType; stats: AreaStat[] } | undefined;
  choroplethLayerConfig: ChoroplethLayerConfig;
}) {
  const getFillColor = (
  ): DataDrivenPropertyValueSpecification<string> => {
    const defaultFillColor = "rgba(0, 0, 0, 0)";
    if (!areaStats) {
      return defaultFillColor
    }

    if (areaStats.columnType !== ColumnType.Number) {
      const distinctValues = new Set(
        areaStats.stats.map((v) => String(v.value))
      );
      const colorScale = scaleOrdinal(schemeCategory10).domain(distinctValues);
      const ordinalColorStops = []
      distinctValues.forEach((v) => {
        ordinalColorStops.push(v);
        ordinalColorStops.push(colorScale(v));
      });
      ordinalColorStops.push(defaultFillColor)
      return [
        "match",
        ["feature-state", "value"],
        ...ordinalColorStops
      ];
    }

    const values = areaStats.stats.map((stat) => stat.value);
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
      return defaultFillColor;
    }

    const numSteps = 30;
    const stepScale = scaleLinear()
      .domain([0, numSteps - 1])
      .range([minValue, maxValue]);

    const colorScale = scaleSequential()
      .domain([minValue, maxValue])
      .interpolator(interpolateOrRd);

    const interpolateColorStops = new Array(numSteps).fill(null).flatMap((_, i) => {
      const step = stepScale(i);
      return [step, colorScale(step)];
    });

    return [
      "interpolate",
      ["linear"],
      ["to-number", ["feature-state", "value"], 0],
      ...interpolateColorStops,
    ];
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
          "fill-color": getFillColor(),
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
