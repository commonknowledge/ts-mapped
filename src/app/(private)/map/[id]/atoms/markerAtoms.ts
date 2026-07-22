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

// Transient timeline range while playback animates. Overrides the view
// config's saved filter and is committed to it only when playback stops,
// so the view is not saved on every playback step.
export const timelinePlaybackRangeAtom = atom<{
  start: number;
  end: number;
} | null>(null);
