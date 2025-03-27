import {
  ScaleSequential,
  scaleLinear,
  scaleOrdinal,
  scaleSequential,
} from "d3-scale";
import { interpolateOrRd, schemeCategory10 } from "d3-scale-chromatic";
import { DataDrivenPropertyValueSpecification } from "mapbox-gl";
import { useMemo } from "react";
import { AreaStats, ColumnType } from "@/__generated__/types";

export interface CategoricColorScheme {
  columnType: ColumnType.String;
  colorMap: Record<string, string>;
}

export interface NumericColorScheme {
  columnType: ColumnType.Number;
  minValue: number;
  maxValue: number;
  colorScale: ScaleSequential<string, never>;
}

const DEFAULT_FILL_COLOR = "rgba(0, 0, 0, 0)";

export const useColorScheme = (
  areaStats: AreaStats | undefined,
): CategoricColorScheme | NumericColorScheme | null => {
  // useMemo to cache calculated scales
  return useMemo(() => {
    if (!areaStats) {
      return null;
    }

    const values = areaStats.stats.map((stat) => stat.value);

    // ColumnType.String and others
    if (areaStats.columnType !== ColumnType.Number) {
      const distinctValues = new Set(values);
      const colorScale = scaleOrdinal(schemeCategory10).domain(distinctValues);
      const colorMap: Record<string, string> = {};
      distinctValues.forEach((v) => {
        colorMap[v] = colorScale(v);
      });
      return {
        columnType: ColumnType.String,
        colorMap,
      };
    }

    // ColumnType.Number
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
      return null;
    }

    const colorScale = scaleSequential()
      .domain([minValue, maxValue])
      .interpolator(interpolateOrRd);

    return {
      columnType: ColumnType.Number,
      minValue,
      maxValue,
      colorScale,
    };
  }, [areaStats]);
};

export const useFillColor = (
  areaStats: AreaStats | undefined,
): DataDrivenPropertyValueSpecification<string> => {
  const colorScheme = useColorScheme(areaStats);
  // useMemo to cache calculated fillColor
  return useMemo(() => {
    if (!areaStats || !colorScheme) {
      return DEFAULT_FILL_COLOR;
    }

    // ColumnType.String and others
    if (colorScheme.columnType !== ColumnType.Number) {
      const ordinalColorStops: string[] = [];
      for (const key of Object.keys(colorScheme.colorMap)) {
        ordinalColorStops.push(key);
        ordinalColorStops.push(colorScheme.colorMap[key]);
      }
      ordinalColorStops.push(DEFAULT_FILL_COLOR);
      return ["match", ["feature-state", "value"], ...ordinalColorStops];
    }

    // ColumnType.Number
    const numSteps = 30;
    const stepScale = scaleLinear()
      .domain([0, numSteps - 1])
      .range([colorScheme.minValue, colorScheme.maxValue]);
    const interpolateColorStops = new Array(numSteps)
      .fill(null)
      .flatMap((_, i) => {
        const step = stepScale(i);
        return [step, colorScheme.colorScale(step)];
      });
    return [
      "interpolate",
      ["linear"],
      ["to-number", ["feature-state", "value"], 0],
      ...interpolateColorStops,
    ];
  }, [areaStats, colorScheme]);
};
