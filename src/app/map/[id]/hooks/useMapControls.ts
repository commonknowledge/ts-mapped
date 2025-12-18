import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
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

  const togglePinDrop = useCallback(
    ({
      cancelDrawMode,
      handleDropPin,
    }: {
      cancelDrawMode: () => void;
      handleDropPin: () => void;
    }) => {
      if (pinDropMode) {
        setPinDropMode(false);
        return;
      }

      // Turn off other modes first, then activate pin drop
      cancelDrawMode();
      setCompareGeographiesMode(false);
      handleDropPin();
    },
    [pinDropMode, setPinDropMode, setCompareGeographiesMode],
  );

  const toggleAddArea = useCallback(
    ({
      cancelDrawMode,
      handleAddArea,
    }: {
      cancelDrawMode: () => void;
      handleAddArea: () => void;
    }) => {
      if (editAreaMode) {
        // Turning off edit mode: force cancel and clear flag
        cancelDrawMode();
        setEditAreaMode(false);
        return;
      }

      // Turning on: disable other modes, start draw, set flag as fallback
      setPinDropMode(false);
      setCompareGeographiesMode(false);
      handleAddArea();
      setEditAreaMode(true);
    },
    [editAreaMode, setPinDropMode, setCompareGeographiesMode, setEditAreaMode],
  );

  const toggleCompareGeographies = useCallback(
    ({ cancelDrawMode }: { cancelDrawMode: () => void }) => {
      if (!compareGeographiesMode) {
        setPinDropMode(false);
        cancelDrawMode();
      }

      setCompareGeographiesMode(!compareGeographiesMode);
    },
    [compareGeographiesMode, setCompareGeographiesMode, setPinDropMode],
  );

  // Listen for escape key and cancel active modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Cancel any active mode
        if (pinDropMode) {
          setPinDropMode(false);
        }
        if (editAreaMode) {
          setEditAreaMode(false);
        }
        if (compareGeographiesMode) {
          setCompareGeographiesMode(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    pinDropMode,
    editAreaMode,
    compareGeographiesMode,
    setPinDropMode,
    setEditAreaMode,
    setCompareGeographiesMode,
  ]);

  return {
    showControls,
    setShowControls,
    pinDropMode,
    setPinDropMode,
    editAreaMode,
    setEditAreaMode,
    compareGeographiesMode,
    setCompareGeographiesMode,
    togglePinDrop,
    toggleAddArea,
    toggleCompareGeographies,
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
