import { atom } from "jotai";
import { DEFAULT_ZOOM } from "@/constants";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { MapRef } from "react-map-gl/mapbox";

export const mapIdAtom = atom<string | null>(null);
export const mapRefAtom = atom<{ current: MapRef | null }>({ current: null });
export const drawAtom = atom<MapboxDraw | null>(null);
export const viewIdAtom = atom<string | null>(null);
export const dirtyViewIdsAtom = atom<string[]>([]);
export const zoomAtom = atom<number>(DEFAULT_ZOOM);
export const pinDropModeAtom = atom<boolean>(false);
export const editAreaModeAtom = atom<boolean>(false);
export const showControlsAtom = atom<boolean>(true);
export const compareGeographiesAtom = atom<boolean>(false);
