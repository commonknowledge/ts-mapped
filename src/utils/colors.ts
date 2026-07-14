import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { PARTY_COLORS, TRAFFIC_LIGHT_COLORS } from "@/constants/colors";

/** Returns a function that maps a category value to its default display colour,
 *  checking PARTY_COLORS first then falling back to a D3 ordinal scale. */
export const getCategoryColorScale = (values: string[]) => {
  const ordinalScale = scaleOrdinal(schemeCategory10).domain(values);
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

/**
 * If every non-blank value is a recognised severity level (Low, Moderate,
 * High, Critical...), returns a value → colour mapping using the traffic-light
 * palette; otherwise null. Requires at least two matching values so arbitrary
 * single-value columns don't get the preset offered.
 */
export const getTrafficLightPreset = (
  values: string[],
): Record<string, string> | null => {
  const preset: Record<string, string> = {};
  let matches = 0;
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized) continue;
    const color = TRAFFIC_LIGHT_COLORS[normalized];
    if (!color) return null;
    preset[value] = color;
    matches++;
  }
  return matches >= 2 ? preset : null;
};
