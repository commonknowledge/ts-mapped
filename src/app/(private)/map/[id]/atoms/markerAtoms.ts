import { atom } from "jotai";
import type { Feature } from "geojson";

export const selectedPlacedMarkerIdAtom = atom<string | null>(null);
export const mapSearchResultAtom = atom<Feature | null>(null);
export const placedMarkerVisibilityAtom = atom<Record<string, boolean>>({});
export const dataSourceVisibilityAtom = atom<Record<string, boolean>>({});
export const dropPinClickHandlerAtom = atom<
  ((e: mapboxgl.MapMouseEvent) => void) | null
>(null);
// "ring" draws marker circles as an ink dot ringed in the marker colour,
// legible on any choropleth fill (used by the light editor prototype)
export const markerAppearanceAtom = atom<"classic" | "ring">("classic");
// Data source whose marker settings panel is open (null = closed)
export const markerSettingsDataSourceIdAtom = atom<string | null>(null);

// Transient timeline range while playback animates. Overrides the view
// config's saved filter and is committed to it only when playback stops,
// so the view is not saved on every playback step.
export const timelinePlaybackRangeAtom = atom<{
  start: number;
  end: number;
} | null>(null);
