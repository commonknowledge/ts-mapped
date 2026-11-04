import type { CombinedAreaStats } from "../data";

// Matches the map's bivariate fill (see getBivariateFillColor in colors.ts):
// each axis is split into three equal ranges between its min and max
export const BIVARIATE_GRID_SIZE = 3;

const getIndex = ({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) => {
  for (let i = 0; i < BIVARIATE_GRID_SIZE - 1; i++) {
    const threshold = min + ((i + 1) * (max - min)) / BIVARIATE_GRID_SIZE;
    if (value <= threshold) return i;
  }
  return BIVARIATE_GRID_SIZE - 1;
};

/** The area codes in one square of the bivariate key ("primary,secondary") */
export const getAreaCodesInBivariateBucket = (
  areaStats: CombinedAreaStats,
  bucket: string,
): string[] => {
  const primaryMin = areaStats.primary?.minValue || 0;
  const primaryMax = areaStats.primary?.maxValue || 0;
  const secondaryMin = areaStats.secondary?.minValue || 0;
  const secondaryMax = areaStats.secondary?.maxValue || 0;
  return areaStats.stats
    .filter((stat) => {
      const primary = Number(stat.primary);
      const secondary = Number(stat.secondary);
      if (
        stat.primary === null ||
        stat.primary === undefined ||
        stat.secondary === null ||
        stat.secondary === undefined ||
        Number.isNaN(primary) ||
        Number.isNaN(secondary)
      ) {
        return false;
      }
      const i = getIndex({ value: primary, min: primaryMin, max: primaryMax });
      const j = getIndex({
        value: secondary,
        min: secondaryMin,
        max: secondaryMax,
      });
      return `${i},${j}` === bucket;
    })
    .map((stat) => stat.areaCode);
};
