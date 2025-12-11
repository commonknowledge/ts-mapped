import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { zoomAtom } from "../atoms/mapStateAtoms";

/**
 * Hook for managing map camera states
 * Currently includes zoom level
 */
export function useMapCamera() {
  const zoom = useAtomValue(zoomAtom);
  const setZoom = useSetAtom(zoomAtom);

  return {
    zoom,
    setZoom,
  };
}

// Individual hooks for granular access
export function useZoom() {
  return useAtomValue(zoomAtom);
}

export function useZoomAtom() {
  return useAtom(zoomAtom);
}

export function useSetZoom() {
  return useSetAtom(zoomAtom);
}
