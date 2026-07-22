import { scaleOrdinal } from "d3-scale";
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
import { DEFAULT_CUSTOM_COLOR } from "@/constants";
import { PARTY_COLORS } from "@/constants/colors";
import { ColorScheme } from "@/models/MapView";

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

/**
 * Samples a colour scheme positionally down the ordered value list, for
 * applying a scheme as pinned category colours.
 */
export const getColorSchemePreset = ({
  scheme,
  orderedValues,
  reversed = false,
}: {
  scheme: ColorScheme;
  orderedValues: string[];
  reversed?: boolean;
}): Record<string, string> => {
  const interpolator = getInterpolator(scheme);
  const denominator = Math.max(orderedValues.length - 1, 1);
  const preset: Record<string, string> = {};
  orderedValues.forEach((value, index) => {
    const position = index / denominator;
    preset[value] = interpolator(reversed ? 1 - position : position);
  });
  return preset;
};

/**
 * Returns a function that maps a category value to its default display
 * colour, checking PARTY_COLORS first then falling back to a D3 ordinal
 * scale. The scale's domain is sorted, not display-ordered, so a value
 * keeps its default colour when values are reordered.
 *
 * This is the single default-colour code path: the map (markers and
 * choropleth), the legend and the colour mapping editors all resolve
 * unpinned colours through it.
 */
export const getCategoryColorScale = (values: string[]) => {
  const ordinalScale = scaleOrdinal(schemeCategory10).domain(
    [...values].sort(),
  );
  return (value: string) =>
    PARTY_COLORS[value.toLowerCase()] ?? ordinalScale(value);
};

/** Converts a `#rgb`/`#rrggbb` hex or `rgb(...)` colour to an `rgba(...)`
 *  string with the given alpha. Returns null for unrecognised formats. */
export const colorWithAlpha = (color: string, alpha: number): string | null => {
  const trimmed = color.trim();
  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const rgbMatch = trimmed.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
  );
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  return null;
};
