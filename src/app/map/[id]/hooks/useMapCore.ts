import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  lastLoadedSourceIdAtom,
  mapBottomPaddingAtom,
  mapIdAtom,
  mapRefAtom,
} from "../atoms/mapStateAtoms";

/**
 * Hook for accessing core map instance references
 * Includes mapId and mapRef (the Mapbox GL instance)
 * Note: Setters are provided for consistency but typically only used during initialization
 */
export function useMapCore() {
  const mapId = useAtomValue(mapIdAtom);
  const setMapId = useSetAtom(mapIdAtom);
  const mapRef = useAtomValue(mapRefAtom);
  const setMapRef = useSetAtom(mapRefAtom);

  return {
    mapId,
    setMapId,
    mapRef,
    setMapRef,
  };
}

// Individual hooks for granular access
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

export function useSetMapRef() {
  return useSetAtom(mapRefAtom);
}

export function useMapBottomPadding() {
  return useAtomValue(mapBottomPaddingAtom);
}

export function useSetMapBottomPadding() {
  return useSetAtom(mapBottomPaddingAtom);
}

export function useLastLoadedSourceId() {
  return useAtomValue(lastLoadedSourceIdAtom);
}

export function useSetLastLoadedSourceId() {
  return useSetAtom(lastLoadedSourceIdAtom);
}
