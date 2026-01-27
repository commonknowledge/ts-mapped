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
import { DEFAULT_CUSTOM_COLOR } from "@/constants";
import { ColumnType } from "@/server/models/DataSource";
import {
  CalculationType,
  ColorScaleType,
  ColorScheme,
  type SteppedColorStep,
} from "@/server/models/MapView";
import { getChoroplethDataKey } from "./components/Choropleth/utils";
import { DEFAULT_FILL_COLOR, PARTY_COLORS } from "./constants";
import type { CombinedAreaStats } from "./data";
import type { MapViewConfig } from "@/server/models/MapView";
import type { ScaleOrdinal, ScaleSequential } from "d3-scale";
import type { DataDrivenPropertyValueSpecification } from "mapbox-gl";

// Simple RGB interpolation helper (white to target color)
const interpolateWhiteToColor = (targetColor: string) => {
  // Parse hex color to RGB
  const hex = targetColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return (t: number) => {
    // Interpolate from white (255, 255, 255) to target color
    const newR = Math.round(255 + t * (r - 255));
    const newG = Math.round(255 + t * (g - 255));
    const newB = Math.round(255 + t * (b - 255));
    return `rgb(${newR}, ${newG}, ${newB})`;
  };
};

export interface CategoricColorScheme {
  colorSchemeType: "categoric";
  colorMap: Record<string, string>;
}

export interface NumericColorScheme {
  colorSchemeType: "numeric";
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
  {
    label: "Custom",
    value: ColorScheme.Custom,
    color: "bg-gradient-to-r from-white to-blue-500",
  },
];

export const calculateStepColor = (
  index: number,
  totalSteps: number,
  viewConfig: MapViewConfig,
) => {
  const { colorScheme, customColor, reverseColorScheme } = viewConfig;
  const interpolator = getInterpolator(
    colorScheme || ColorScheme.RedBlue,
    customColor,
  );
  const gradientPosition = totalSteps > 1 ? index / (totalSteps - 1) : 0;
  const t = reverseColorScheme ? 1 - gradientPosition : gradientPosition;
  const clampedT = Math.max(0, Math.min(1, t));
  return interpolator(clampedT) || "#cccccc";
};

export const getInterpolator = (
  scheme: ColorScheme | null | undefined,
  customColor?: string,
) => {
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
    case ColorScheme.Custom:
      // Interpolate from white to custom color
      const targetColor = customColor || DEFAULT_CUSTOM_COLOR;
      return interpolateWhiteToColor(targetColor);
    default:
      return interpolateOrRd;
  }
};

export const useColorScheme = ({
  areaStats,
  viewConfig,
}: {
  areaStats: CombinedAreaStats | null;
  viewConfig: MapViewConfig;
}): CategoricColorScheme | NumericColorScheme | null => {
  // useMemo to cache calculated scales
  return useMemo(() => {
    return getColorScheme({
      areaStats,
      viewConfig,
    });
  }, [areaStats, viewConfig]);
};

const getColorScheme = ({
  areaStats,
  viewConfig,
}: {
  areaStats: CombinedAreaStats | null;
  viewConfig: MapViewConfig;
}): CategoricColorScheme | NumericColorScheme | null => {
  if (!areaStats || !areaStats.stats.length) {
    return null;
  }

  const values = areaStats.stats.map((stat) => stat.primary);

  // ColumnType.String and others
  const isCategoric =
    areaStats.primary?.columnType !== ColumnType.Number ||
    viewConfig.colorScaleType === ColorScaleType.Categorical;
  if (isCategoric) {
    const distinctValues = Array.from(new Set(values.map(String)))
      .sort()
      .slice(0, 50);
    const colorScale = scaleOrdinal(schemeCategory10).domain(distinctValues);
    const colorMap: Record<string, string> = {};
    distinctValues.forEach((v) => {
      // Use custom color if provided, otherwise use default
      colorMap[v] =
        viewConfig.categoryColors?.[v] ?? getCategoricalColor(v, colorScale);
    });
    colorMap.__default =
      viewConfig.categoryColors?.__default ?? DEFAULT_FILL_COLOR;
    return {
      colorSchemeType: "categoric",
      colorMap,
    };
  }

  // ColumnType.Number

  // Handle case where all values are the same (e.g., all counts are 1)
  const minValue = areaStats.primary?.minValue || 0;
  const maxValue = areaStats.primary?.maxValue || 0;
  if (minValue === maxValue) {
    const domain = viewConfig.reverseColorScheme ? [1, 0] : [0, 1];
    // For count records, create a simple color scheme
    // Use a small range to ensure valid interpolation
    const interpolator = getInterpolator(
      viewConfig.colorScheme,
      viewConfig.customColor,
    );
    const colorScale = scaleSequential()
      .domain(domain) // Use 0-1 range for single values
      .interpolator(interpolator);

    return {
      colorSchemeType: "numeric",
      minValue: 0,
      maxValue: 1,
      colorScale,
      isSingleValue: true,
    };
  }

  const domain = (
    viewConfig.reverseColorScheme ? [maxValue, minValue] : [minValue, maxValue]
  ) as [number, number];

  const interpolator = getInterpolator(
    viewConfig.colorScheme,
    viewConfig.customColor,
  );
  const colorScale = scaleSequential()
    .domain(domain)
    .interpolator(interpolator);

  return {
    colorSchemeType: "numeric",
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
  viewConfig,
  selectedBivariateBucket,
}: {
  areaStats: CombinedAreaStats | null;
  viewConfig: MapViewConfig;
  selectedBivariateBucket: string | null;
}): DataDrivenPropertyValueSpecification<string> => {
  // useMemo to cache calculated fillColor
  return useMemo(() => {
    if (areaStats?.secondary) {
      return getBivariateFillColor(areaStats, selectedBivariateBucket);
    }

    const isCount = areaStats?.calculationType === CalculationType.Count;
    const colorScheme = getColorScheme({
      areaStats,
      viewConfig,
    });
    if (!colorScheme) {
      return DEFAULT_FILL_COLOR;
    }

    // ColumnType.String and others
    if (colorScheme.colorSchemeType === "categoric") {
      const ordinalColorStops: string[] = [];
      for (const key of Object.keys(colorScheme.colorMap)) {
        ordinalColorStops.push(key);
        ordinalColorStops.push(colorScheme.colorMap[key]);
      }
      ordinalColorStops.push(colorScheme.colorMap.__default);
      return [
        "match",
        ["to-string", ["feature-state", "value"]],
        ...ordinalColorStops,
      ];
    }

    // ColumnType.Number - Check if stepped colors are enabled
    const steppedColorSteps =
      viewConfig.steppedColorStepsByKey?.[getChoroplethDataKey(viewConfig)];
    if (
      viewConfig.colorScaleType === ColorScaleType.Stepped &&
      steppedColorSteps &&
      steppedColorSteps.length > 0
    ) {
      return getSteppedFillColor(steppedColorSteps, isCount, viewConfig);
    }

    // ColumnType.Number - Gradient (default)
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
  }, [areaStats, viewConfig, selectedBivariateBucket]);
};

const getSteppedFillColor = (
  steps: SteppedColorStep[],
  isCount: boolean,
  viewConfig: MapViewConfig,
): DataDrivenPropertyValueSpecification<string> => {
  // Sort steps by start value to ensure correct order
  const sortedSteps = [...steps].sort((a, b) => a.start - b.start);

  if (sortedSteps.length === 0) {
    return DEFAULT_FILL_COLOR;
  }

  if (sortedSteps.length === 1) {
    return calculateStepColor(0, sortedSteps.length, viewConfig);
  }

  // Build a step expression: ["step", input, default, threshold1, color1, threshold2, color2, ...]
  // Mapbox step expression: if value < threshold1, use default, else if value < threshold2, use color1, etc.
  // For stepped colors, we want: if value < step1.start, use step1.color (or default)
  //                              if step1.start <= value < step2.start, use step1.color
  //                              if step2.start <= value < step3.start, use step2.color
  //                              etc.

  const stepExpression: DataDrivenPropertyValueSpecification<string> = [
    "step",
    isCount
      ? ["coalesce", ["feature-state", "value"], 0]
      : ["feature-state", "value"],
    calculateStepColor(0, sortedSteps.length, viewConfig),
  ];

  // Add thresholds and colors
  // For each step after the first, use its start value as the threshold
  // The color applies to values >= threshold
  for (let i = 1; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];
    const color = calculateStepColor(i, sortedSteps.length, viewConfig);
    stepExpression.push(step.start); // Threshold
    stepExpression.push(color); // Color for values >= threshold
  }

  return stepExpression;
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
