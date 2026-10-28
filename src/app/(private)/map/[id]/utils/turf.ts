const SQUARE_METRES_PER_KM2 = 1_000_000;

// Name for an area the user hasn't labelled, from its size in m²
export const getTurfDisplayName = (turf: {
  label?: string | null;
  area?: number | null;
}) => {
  if (turf.label) {
    return turf.label;
  }
  const area = turf.area ?? 0;
  const size =
    area >= SQUARE_METRES_PER_KM2
      ? `${(area / SQUARE_METRES_PER_KM2).toLocaleString("en-GB", { maximumFractionDigits: 1 })} km²`
      : `${Math.round(area).toLocaleString("en-GB")} m²`;
  return `Area · ${size}`;
};
