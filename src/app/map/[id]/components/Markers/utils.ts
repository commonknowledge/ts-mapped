export const MARKER_CLIENT_EXCLUDED_KEY = "__clientExcluded";

const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const DEFAULT_FALLBACK_COLOR = "#808080"; // Gray as fallback

export function hexToRgb(hex: string) {
  // Validate hex format
  if (!HEX_COLOR_REGEX.test(hex)) {
    console.warn(
      `Invalid hex color format: "${hex}". Using fallback color.`,
    );
    hex = DEFAULT_FALLBACK_COLOR;
  }

  const normalized = hex.replace("#", "");
  
  // Expand shorthand hex (e.g., #fff -> #ffffff)
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const bigint = parseInt(expanded, 16);
  
  // Check if parsing resulted in NaN
  if (isNaN(bigint)) {
    console.warn(
      `Failed to parse hex color: "${hex}". Using fallback color.`,
    );
    const fallbackInt = parseInt(DEFAULT_FALLBACK_COLOR.replace("#", ""), 16);
    const r = (fallbackInt >> 16) & 255;
    const g = (fallbackInt >> 8) & 255;
    const b = fallbackInt & 255;
    return { r, g, b };
  }

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

export function rgbaString(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
