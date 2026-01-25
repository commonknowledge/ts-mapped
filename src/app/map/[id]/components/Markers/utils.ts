export const MARKER_CLIENT_EXCLUDED_KEY = "__clientExcluded";

const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const DEFAULT_FALLBACK_COLOR = "#808080"; // Gray as fallback

// Pre-compute fallback color RGB values to avoid redundant calculations
const FALLBACK_RGB = (() => {
  const normalized = DEFAULT_FALLBACK_COLOR.replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
})();

export function hexToRgb(hex: string) {
  // Validate hex format
  if (!HEX_COLOR_REGEX.test(hex)) {
    console.warn(
      `Invalid hex color format: "${hex}". Using fallback color.`,
    );
    return FALLBACK_RGB;
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
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

export function rgbaString(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
