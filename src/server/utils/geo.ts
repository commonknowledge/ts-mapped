import type { Point } from "../models/shared";

export const geojsonPointToPoint = (
  geojson: string | undefined,
): Point | null => {
  if (!geojson) {
    return null;
  }
  const [lng, lat] = (JSON.parse(geojson) as { coordinates: [number, number] })
    .coordinates;
  return { lng, lat };
};
