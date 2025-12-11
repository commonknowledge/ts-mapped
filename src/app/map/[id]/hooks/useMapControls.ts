import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { pinDropModeAtom, showControlsAtom } from "../atoms/mapStateAtoms";

/**
 * Hook for managing map UI control states
 * Includes showControls (sidebar visibility) and pinDropMode (pin dropping interaction)
 */
export function useMapControls() {
  const [showControls, setShowControls] = useAtom(showControlsAtom);
  const [pinDropMode, setPinDropMode] = useAtom(pinDropModeAtom);

  return {
    showControls,
    setShowControls,
    pinDropMode,
    setPinDropMode,
  };
}

// Individual hooks for granular access
export function useShowControls() {
  return useAtomValue(showControlsAtom);
}

export function useShowControlsAtom() {
  return useAtom(showControlsAtom);
}

export function useSetShowControls() {
  return useSetAtom(showControlsAtom);
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
