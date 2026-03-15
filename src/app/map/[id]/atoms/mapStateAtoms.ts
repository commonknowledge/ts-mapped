import { atom } from "jotai";
import { DEFAULT_ZOOM } from "@/constants";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { MapRef } from "react-map-gl/mapbox";

export type MapMode = "private" | "public";
export const mapModeAtom = atom<MapMode>("private");

/**
 * `true` on the standalone public page (`/public/[host]`), `false` everywhere else.
 * Replaces the old `editableAtom` and `showNavbarAtom` props – both are now
 * derived from this single atom.
 */
export const isPublicMapRouteAtom = atom<boolean>(false);

/** Derived: the navbar is visible exactly when we are NOT on the public route. */
export const showNavbarAtom = atom<boolean>(
  (get) => !get(isPublicMapRouteAtom),
);

export const mapIdAtom = atom<string | null>(null);
export const mapRefAtom = atom<{ current: MapRef | null }>({ current: null });
export const drawAtom = atom<MapboxDraw | null>(null);
export const drawModeAtom = atom<string | null>("");
export const viewIdAtom = atom<string | null>(null);
export const dirtyViewIdsAtom = atom<string[]>([]);
export const zoomAtom = atom<number>(DEFAULT_ZOOM);
export const pinDropModeAtom = atom<boolean>(false);
export const editAreaModeAtom = atom<boolean>(false);
export const showControlsAtom = atom<boolean>(true);
export const compareGeographiesAtom = atom<boolean>(false);
export const infoPopupOpenAtom = atom<boolean>(false);
export const infoPopupEditingAtom = atom<boolean>(false);
export const mapBottomPaddingAtom = atom<number>(0);
export const lastLoadedSourceIdAtom = atom<string | undefined>(undefined);
