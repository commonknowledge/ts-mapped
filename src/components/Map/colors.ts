import {
  ScaleOrdinal,
  ScaleSequential,
  scaleLinear,
  scaleOrdinal,
  scaleSequential,
} from "d3-scale";
import { interpolateOrRd, schemeCategory10 } from "d3-scale-chromatic";
import { DataDrivenPropertyValueSpecification } from "mapbox-gl";
import { useMemo } from "react";
import { AreaStats, ColumnType } from "@/__generated__/types";
import { DEFAULT_FILL_COLOR, PARTY_COLORS } from "./constants";

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

export const useColorScheme = (
  areaStats: AreaStats | null | undefined,
): CategoricColorScheme | NumericColorScheme | null => {
  // useMemo to cache calculated scales
  return useMemo(() => {
    if (!areaStats || !areaStats.stats.length) {
      return null;
    }

    const values = areaStats.stats.map((stat) => stat.value);

    // ColumnType.String and others
    if (areaStats.columnType !== ColumnType.Number) {
      const distinctValues = new Set(values);
      const colorScale = scaleOrdinal(schemeCategory10).domain(distinctValues);
      const colorMap: Record<string, string> = {};
      distinctValues.forEach((v) => {
        colorMap[v] = getCategoricalColor(v, colorScale);
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

const getCategoricalColor = (
  key: string,
  colorScale: ScaleOrdinal<string, string, never>,
) => {
  return PARTY_COLORS[key.toLowerCase()] ?? colorScale(key);
};

export const useFillColor = (
  areaStats: AreaStats | null | undefined,
): DataDrivenPropertyValueSpecification<string> => {
  const colorScheme = useColorScheme(areaStats);
  // useMemo to cache calculated fillColor
  return useMemo(() => {
    if (!colorScheme) {
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
      ["feature-state", "value"],
      ...interpolateColorStops,
    ];
  }, [colorScheme]);
};
