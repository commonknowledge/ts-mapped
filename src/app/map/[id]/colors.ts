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
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import { DEFAULT_FILL_COLOR, PARTY_COLORS } from "./constants";
import type { CombinedAreaStats } from "./data";
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

export const BIVARIATE_COLORS = [
  // Low var1, increasing var2 →
  ["#e8e8e8", "#ace4e4", "#5ac8c8"],
  // Mid var1, increasing var2 →
  ["#dfb0d6", "#a5add3", "#5698b9"],
  // High var1, increasing var2 →
  ["#be64ac", "#8c62aa", "#3b4994"],
];

export const CHOROPLETH_COLOR_SCHEMES = [
  {
    label: "Sequential",
    value: ColorScheme.Sequential,
    color: "bg-gradient-to-r from-blue-100 to-blue-600",
  },
  {
    label: "Red-Blue",
    value: ColorScheme.RedBlue,
    color: "bg-gradient-to-r from-red-500 to-blue-500",
  },
  {
    label: "Green-Yellow-Red",
    value: ColorScheme.GreenYellowRed,
    color: "bg-gradient-to-r from-green-500 via-yellow-500 to-red-500",
  },
  {
    label: "Viridis",
    value: ColorScheme.Viridis,
    color: "bg-gradient-to-r from-purple-600 via-blue-500 to-green-500",
  },
  {
    label: "Plasma",
    value: ColorScheme.Plasma,
    color: "bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500",
  },
  {
    label: "Diverging",
    value: ColorScheme.Diverging,
    color: "bg-gradient-to-r from-brown-500 via-yellow-500 to-teal-500",
  },
];

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

export const useColorScheme = ({
  areaStats,
  scheme,
  isReversed,
  categoryColors,
}: {
  areaStats: CombinedAreaStats | null;
  scheme: ColorScheme;
  isReversed: boolean;
  categoryColors?: Record<string, string>;
}): CategoricColorScheme | NumericColorScheme | null => {
  // useMemo to cache calculated scales
  return useMemo(() => {
    return getColorScheme({ areaStats, scheme, isReversed, categoryColors });
  }, [areaStats, scheme, isReversed, categoryColors]);
};

const getColorScheme = ({
  areaStats,
  scheme,
  isReversed,
  categoryColors,
}: {
  areaStats: CombinedAreaStats | null;
  scheme: ColorScheme;
  isReversed: boolean;
  categoryColors?: Record<string, string>;
}): CategoricColorScheme | NumericColorScheme | null => {
  if (!areaStats || !areaStats.stats.length) {
    return null;
  }

  const values = areaStats.stats.map((stat) => stat.primary);

  // ColumnType.String and others
  if (areaStats.primary?.columnType !== ColumnType.Number) {
    const distinctValues = new Set(values.map(String));
    const colorScale = scaleOrdinal(schemeCategory10).domain(distinctValues);
    const colorMap: Record<string, string> = {};
    distinctValues.forEach((v) => {
      // Use custom color if provided, otherwise use default
      colorMap[v] =
        categoryColors?.[v] ?? getCategoricalColor(v, colorScale);
    });
    return {
      columnType: ColumnType.String,
      colorMap,
    };
  }

  // ColumnType.Number

  // Handle case where all values are the same (e.g., all counts are 1)
  const minValue = areaStats.primary.minValue;
  const maxValue = areaStats.primary.maxValue;
  if (minValue === maxValue) {
    const domain = isReversed ? [1, 0] : [0, 1];
    // For count records, create a simple color scheme
    // Use a small range to ensure valid interpolation
    const interpolator = getInterpolator(scheme);
    const colorScale = scaleSequential()
      .domain(domain) // Use 0-1 range for single values
      .interpolator(interpolator);

    return {
      columnType: ColumnType.Number,
      minValue: 0,
      maxValue: 1,
      colorScale,
      isSingleValue: true,
    };
  }

  const domain = (isReversed ? [maxValue, minValue] : [minValue, maxValue]) as [
    number,
    number,
  ];

  const interpolator = getInterpolator(scheme);
  const colorScale = scaleSequential()
    .domain(domain)
    .interpolator(interpolator);

  return {
    columnType: ColumnType.Number,
    minValue,
    maxValue,
    colorScale,
  };
};

const getCategoricalColor = (
  key: string,
  colorScale: ScaleOrdinal<string, string, never>,
) => {
  return PARTY_COLORS[key.toLowerCase()] ?? colorScale(key);
};

export const useFillColor = ({
  areaStats,
  scheme,
  isReversed,
  selectedBivariateBucket,
  categoryColors,
}: {
  areaStats: CombinedAreaStats | null;
  scheme: ColorScheme;
  isReversed: boolean;
  selectedBivariateBucket: string | null;
  categoryColors?: Record<string, string>;
}): DataDrivenPropertyValueSpecification<string> => {
  // useMemo to cache calculated fillColor
  return useMemo(() => {
    if (areaStats?.secondary) {
      return getBivariateFillColor(areaStats, selectedBivariateBucket);
    }

    const isCount = areaStats?.calculationType === CalculationType.Count;
    const colorScheme = getColorScheme({
      areaStats,
      scheme,
      isReversed,
      categoryColors,
    });
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
        const color = colorScheme.colorScale(step);
        return [step, color];
      });
    return [
      "interpolate",
      ["linear"],
      isCount
        ? ["coalesce", ["feature-state", "value"], 0]
        : ["feature-state", "value"],
      ...interpolateColorStops,
    ];
  }, [areaStats, isReversed, scheme, selectedBivariateBucket]);
};

const getBivariateFillColor = (
  areaStats: CombinedAreaStats,
  selectedBivariateBucket: string | null,
): DataDrivenPropertyValueSpecification<string> => {
  const gridSize = 3;

  const primaryMin = areaStats.primary?.minValue || 0;
  const primaryMax = areaStats.primary?.maxValue || 0;

  const secondaryMin = areaStats.secondary?.minValue || 0;
  const secondaryMax = areaStats.secondary?.maxValue || 0;

  // Calculate which grid cell each feature falls into
  const primaryThresholds = Array.from(
    { length: gridSize - 1 },
    (_, i) => primaryMin + ((i + 1) * (primaryMax - primaryMin)) / gridSize,
  );

  const secondaryThresholds = Array.from(
    { length: gridSize - 1 },
    (_, i) =>
      secondaryMin + ((i + 1) * (secondaryMax - secondaryMin)) / gridSize,
  );

  // Build nested case expressions to map both values to colors
  const getValue = ["feature-state", "value"];

  const getSecondaryValue = ["feature-state", "secondaryValue"];

  // Create nested case statements
  const cases: DataDrivenPropertyValueSpecification<string> = ["case"];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const conditions: DataDrivenPropertyValueSpecification<string> = ["all"];

      // Condition for dimension 1
      if (i === 0) {
        conditions.push(["<=", getValue, primaryThresholds[0]]);
      } else if (i === gridSize - 1) {
        conditions.push([">", getValue, primaryThresholds[i - 1]]);
      } else {
        conditions.push([
          "all",
          [">", getValue, primaryThresholds[i - 1]],
          ["<=", getValue, primaryThresholds[i]],
        ]);
      }

      // Condition for dimension 2
      if (j === 0) {
        conditions.push(["<=", getSecondaryValue, secondaryThresholds[0]]);
      } else if (j === gridSize - 1) {
        conditions.push([">", getSecondaryValue, secondaryThresholds[j - 1]]);
      } else {
        conditions.push([
          "all",
          [">", getSecondaryValue, secondaryThresholds[j - 1]],
          ["<=", getSecondaryValue, secondaryThresholds[j]],
        ]);
      }

      cases.push(conditions);
      cases.push(
        selectedBivariateBucket && selectedBivariateBucket !== `${i},${j}`
          ? "rgba(0,0,0,0)"
          : BIVARIATE_COLORS[i][j],
      );
    }
  }

  // Default color
  cases.push(DEFAULT_FILL_COLOR);

  return cases;
};
