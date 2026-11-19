import { atom } from "jotai";
import { DEFAULT_ZOOM } from "@/constants";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { MapRef } from "react-map-gl/mapbox";

/**
 * Which of the four map pages is rendering:
 * - "editor": the private map editor (`/map/[id]`)
 * - "publish": the public map editor (`/map/[id]?mode=publish`)
 * - "public": a published public map (`/public/[host]`)
 * - "shared": a private map shared read-only (`/share/[token]`)
 *
 * Set once by MapJotaiProvider; only the editor and publish routes switch
 * between each other (with the `mode` URL parameter).
 */
export type MapRoute = "editor" | "publish" | "public" | "shared";
export const mapRouteAtom = atom<MapRoute>("editor");

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
export const infoPopupOpenAtom = atom<boolean>(false);
export const infoPopupEditingAtom = atom<boolean>(false);
export const mapBottomPaddingAtom = atom<number>(0);
export const lastLoadedSourceIdAtom = atom<string | undefined>(undefined);
