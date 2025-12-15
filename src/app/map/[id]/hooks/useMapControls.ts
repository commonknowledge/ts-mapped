import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  compareGeographiesAtom,
  editAreaModeAtom,
  pinDropModeAtom,
  showControlsAtom,
} from "../atoms/mapStateAtoms";

/**
 * Hook for managing map UI control states
 * Includes showControls (sidebar visibility), pinDropMode (pin dropping interaction),
 * editAreaMode (area editing interaction), and compareGeographiesMode (multi-select geographies)
 */
export function useMapControls() {
  const [showControls, setShowControls] = useAtom(showControlsAtom);
  const [pinDropMode, setPinDropMode] = useAtom(pinDropModeAtom);
  const [editAreaMode, setEditAreaMode] = useAtom(editAreaModeAtom);
  const [compareGeographiesMode, setCompareGeographiesMode] = useAtom(
    compareGeographiesAtom,
  );

  return {
    showControls,
    setShowControls,
    pinDropMode,
    setPinDropMode,
    editAreaMode,
    setEditAreaMode,
    compareGeographiesMode,
    setCompareGeographiesMode,
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

export function useEditAreaMode() {
  return useAtomValue(editAreaModeAtom);
}

export function useEditAreaModeAtom() {
  return useAtom(editAreaModeAtom);
}

export function useSetEditAreaMode() {
  return useSetAtom(editAreaModeAtom);
}

export function useCompareGeographiesMode() {
  return useAtomValue(compareGeographiesAtom);
}

export function useCompareGeographiesModeAtom() {
  return useAtom(compareGeographiesAtom);
}

export function useSetCompareGeographiesMode() {
  return useSetAtom(compareGeographiesAtom);
}
