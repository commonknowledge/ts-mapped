import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { mapIdAtom, mapRefAtom } from "../atoms/mapStateAtoms";

/**
 * Hook for accessing core map instance references
 * Includes mapId and mapRef (the Mapbox GL instance)
 */
export function useMapCore() {
  const mapId = useAtomValue(mapIdAtom);
  const mapRef = useAtomValue(mapRefAtom);

  return {
    mapId,
    mapRef,
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
