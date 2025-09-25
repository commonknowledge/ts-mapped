import { scaleLinear, scaleOrdinal, scaleSequential } from "d3-scale";
import {
  interpolateBlues,
  interpolateBrBG,
  interpolateOrRd,
  interpolatePlasma,
  interpolateRdBu,
  interpolateRdYlGn,
  interpolateViridis,
  schemeCategory10,
} from "d3-scale-chromatic";
import { useMemo } from "react";
import { ColumnType } from "@/server/models/DataSource";
import { ColorScheme } from "@/server/models/MapView";
import { DEFAULT_FILL_COLOR, PARTY_COLORS } from "./constants";
import type { RouterOutputs } from "@/services/trpc/react";
import type { ScaleOrdinal, ScaleSequential } from "d3-scale";
import type { DataDrivenPropertyValueSpecification } from "mapbox-gl";

export interface CategoricColorScheme {
  columnType: ColumnType.String;
  colorMap: Record<string, string>;
}

export interface NumericColorScheme {
  columnType: ColumnType.Number;
  minValue: number;
  maxValue: number;
  colorScale: ScaleSequential<string, never>;
  isSingleValue?: boolean;
  singleColor?: string;
}

const getInterpolator = (scheme: ColorScheme | undefined) => {
  switch (scheme) {
    case ColorScheme.RedBlue:
      return interpolateRdBu;
    case ColorScheme.GreenYellowRed:
      // Reverse RdYlGn to get green->yellow->red
      return (t: number) => interpolateRdYlGn(1 - t);
    case ColorScheme.Viridis:
      return interpolateViridis;
    case ColorScheme.Plasma:
      return interpolatePlasma;
    case ColorScheme.Diverging:
      return interpolateBrBG;
    case ColorScheme.Sequential:
      return interpolateBlues;
    default:
      return interpolateOrRd;
  }
};

export const useColorScheme = (
  areaStats: RouterOutputs["area"]["stats"] | null | undefined,
  scheme: ColorScheme,
  isCount: boolean,
): CategoricColorScheme | NumericColorScheme | null => {
  // useMemo to cache calculated scales
  return useMemo(() => {
    if (!areaStats || !areaStats.stats.length) {
      return null;
    }

    const values = areaStats.stats.map((stat) => stat.value) as number[];

    // ColumnType.String and others
    if (areaStats.columnType !== ColumnType.Number) {
      const distinctValues = new Set(values);
      const colorScale = scaleOrdinal(schemeCategory10).domain(
        distinctValues as Iterable<string>,
      );
      const colorMap: Record<string, string> = {};
      distinctValues.forEach((v) => {
        colorMap[v] = getCategoricalColor(v.toString(), colorScale);
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

    // Override minValue for counts for full range of values
    if (isCount) {
      minValue = 0;
    }

    // Handle case where all values are the same (e.g., all counts are 1)
    if (minValue === maxValue) {
      // For count records, create a simple color scheme
      // Use a small range to ensure valid interpolation
      const interpolator = getInterpolator(scheme);
      const colorScale = scaleSequential()
        .domain([0, 1]) // Use 0-1 range for single values
        .interpolator(interpolator);

      return {
        columnType: ColumnType.Number,
        minValue: 0,
        maxValue: 1,
        colorScale,
        isSingleValue: true,
      };
    }

    const interpolator = getInterpolator(scheme);
    const colorScale = scaleSequential()
      .domain([minValue, maxValue] as Iterable<number>)
      .interpolator(interpolator);

    return {
      columnType: ColumnType.Number,
      minValue: minValue ?? 0,
      maxValue: maxValue ?? 0,
      colorScale,
    };
  }, [areaStats, isCount, scheme]);
};

const getCategoricalColor = (
  key: string,
  colorScale: ScaleOrdinal<string, string, never>,
) => {
  return PARTY_COLORS[key.toLowerCase()] ?? colorScale(key);
};

export const useFillColor = (
  areaStats: RouterOutputs["area"]["stats"] | null | undefined,
  scheme: ColorScheme,
  isCount: boolean,
): DataDrivenPropertyValueSpecification<string> => {
  const colorScheme = useColorScheme(areaStats, scheme, isCount);
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
    if (colorScheme.isSingleValue) {
      // When all values are the same, map the value to our 0-1 range
      // This ensures count data is visible even when all counts are equal
      return [
        "interpolate",
        ["linear"],
        isCount
          ? ["coalesce", ["feature-state", "value"], 0]
          : ["feature-state", "value"],
        0,
        colorScheme.colorScale(0),
        1,
        colorScheme.colorScale(1),
      ];
    }

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
      isCount
        ? ["coalesce", ["feature-state", "value"], 0]
        : ["feature-state", "value"],
      ...interpolateColorStops,
    ];
  }, [colorScheme, isCount]);
};
