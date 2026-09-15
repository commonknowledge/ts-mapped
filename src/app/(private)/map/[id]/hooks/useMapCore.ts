import { useAtom, useAtomValue, useAtomValueRawSync, useSetAtom } from "jotai";
import {
  drawModeAtom,
  lastLoadedSourceIdAtom,
  mapBottomPaddingAtom,
  mapIdAtom,
  mapModeAtom,
  mapRefAtom,
  showNavbarAtom,
} from "../atoms/mapStateAtoms";

// Route-level atoms (map ID, view ID, map mode) are written during mount: by
// MapJotaiProvider's hydration and by effects such as useInitialMapViewEffect.
// jotai 3's `useAtomValue` no longer re-renders once after subscribing, so a
// component that rendered before such a write and subscribed after it would
// keep the stale value until the atom next changed (see "A subtle mount-timing
// change in v3" in the jotai docs). `useAtomValueRawSync` is built on
// useSyncExternalStore and always picks up writes made during mount. Only use
// it for atoms that are written while readers are mounting; everything else
// stays on `useAtomValue`.

/**
 * Hook for accessing core map instance references
 * Includes mapId and mapRef (the Mapbox GL instance)
 * Note: Setters are provided for consistency but typically only used during initialization
 */
export function useMapCore() {
  const mapId = useAtomValueRawSync(mapIdAtom);
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
  return useAtomValueRawSync(mapIdAtom);
}

export function useMapIdAtom(): [
  string | null,
  (mapId: string | null) => void,
] {
  return [useAtomValueRawSync(mapIdAtom), useSetAtom(mapIdAtom)];
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

export function useMapMode() {
  return useAtomValueRawSync(mapModeAtom);
}

export function useShowNavbar() {
  return useAtomValue(showNavbarAtom);
}

export function useDrawMode() {
  return useAtomValue(drawModeAtom);
}

export function useSetDrawMode() {
  return useSetAtom(drawModeAtom);
}
