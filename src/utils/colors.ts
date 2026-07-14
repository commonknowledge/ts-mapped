import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { PARTY_COLORS, TRAFFIC_LIGHT_SCALE } from "@/constants/colors";

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
 * Assigns traffic-light colours positionally down the ordered value list:
 * first value red, then orange, yellow, green, with grey for the fifth and
 * anything after. Blank values are skipped (left uncoloured) and don't
 * consume a colour.
 */
export const getTrafficLightPreset = (
  orderedValues: string[],
): Record<string, string> => {
  const preset: Record<string, string> = {};
  let position = 0;
  for (const value of orderedValues) {
    if (!value.trim()) continue;
    preset[value] =
      TRAFFIC_LIGHT_SCALE[Math.min(position, TRAFFIC_LIGHT_SCALE.length - 1)];
    position++;
  }
  return preset;
};
