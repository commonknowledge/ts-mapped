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

// Ephemeral single-year filter for markers (session-only, not persisted).
// Only applies to data sources with a yearColumn (or dateColumn) role.
export interface YearFilter {
  enabled: boolean;
  year: number | null;
}
export const yearFilterAtom = atom<YearFilter>({
  enabled: false,
  year: null,
});
