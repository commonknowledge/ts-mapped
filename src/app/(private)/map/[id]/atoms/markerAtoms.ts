import { atom } from "jotai";
import type { Feature } from "geojson";

export const selectedPlacedMarkerIdAtom = atom<string | null>(null);
export const mapSearchResultAtom = atom<Feature | null>(null);
export const placedMarkerVisibilityAtom = atom<Record<string, boolean>>({});
export const dataSourceVisibilityAtom = atom<Record<string, boolean>>({});
export const dropPinClickHandlerAtom = atom<
  ((e: mapboxgl.MapMouseEvent) => void) | null
>(null);
// Data source whose marker settings panel is open (null = closed)
export const markerSettingsDataSourceIdAtom = atom<string | null>(null);

// Ephemeral year range filter for markers (session-only, not persisted).
// Only applies to data sources with a yearColumn role.
export interface YearFilter {
  enabled: boolean;
  min: number | null;
  max: number | null;
}
export const yearFilterAtom = atom<YearFilter>({
  enabled: false,
  min: null,
  max: null,
});
