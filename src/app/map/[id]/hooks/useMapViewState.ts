import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { dirtyViewIdsAtom, viewIdAtom } from "../atoms/mapStateAtoms";

/**
 * Hook for managing map view state
 * Includes currently selected viewId and dirty tracking for unsaved changes
 */
export function useMapViewState() {
  const viewId = useAtomValue(viewIdAtom);
  const setViewId = useSetAtom(viewIdAtom);
  const dirtyViewIds = useAtomValue(dirtyViewIdsAtom);
  const setDirtyViewIds = useSetAtom(dirtyViewIdsAtom);

  return {
    viewId,
    setViewId,
    dirtyViewIds,
    setDirtyViewIds,
  };
}

// Individual hooks for granular access
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
