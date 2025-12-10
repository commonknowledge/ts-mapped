import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  mapIdAtom,
  mapRefAtom,
  viewIdAtom,
  dirtyViewIdsAtom,
  zoomAtom,
  pinDropModeAtom,
  showControlsAtom,
} from "../atoms/mapStateAtoms";

export function useMapId() {
  return useAtomValue(mapIdAtom);
}

export function useMapIdAtom() {
  return useAtom(mapIdAtom);
}

export function useSetMapId() {
  return useSetAtom(mapIdAtom);
}

export function useMapRef() {
  return useAtomValue(mapRefAtom);
}

export function useMapRefAtom() {
  return useAtom(mapRefAtom);
}

export function useViewId() {
  return useAtomValue(viewIdAtom);
}

export function useViewIdAtom() {
  return useAtom(viewIdAtom);
}

export function useSetViewId() {
  return useSetAtom(viewIdAtom);
}

export function useDirtyViewIds() {
  return useAtomValue(dirtyViewIdsAtom);
}

export function useDirtyViewIdsAtom() {
  return useAtom(dirtyViewIdsAtom);
}

export function useSetDirtyViewIds() {
  return useSetAtom(dirtyViewIdsAtom);
}

export function useZoom() {
  return useAtomValue(zoomAtom);
}

export function useZoomAtom() {
  return useAtom(zoomAtom);
}

export function useSetZoom() {
  return useSetAtom(zoomAtom);
}

export function usePinDropMode() {
  return useAtomValue(pinDropModeAtom);
}

export function usePinDropModeAtom() {
  return useAtom(pinDropModeAtom);
}

export function useSetPinDropMode() {
  return useSetAtom(pinDropModeAtom);
}

export function useShowControls() {
  return useAtomValue(showControlsAtom);
}

export function useShowControlsAtom() {
  return useAtom(showControlsAtom);
}

export function useSetShowControls() {
  return useSetAtom(showControlsAtom);
}
