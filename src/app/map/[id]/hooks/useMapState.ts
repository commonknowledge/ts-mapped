/**
 * Map State Hooks
 * 
 * This module provides hooks for accessing map state managed by Jotai atoms.
 * 
 * ## Packaged Hooks (Recommended for accessing multiple related values)
 * 
 * - `useMapControls()` - UI control states (showControls, pinDropMode)
 * - `useMapCamera()` - Camera-related states (zoom, and potentially bounds)
 * - `useMapCore()` - Core map references (mapId, mapRef)
 * - `useMapViewState()` - View management (viewId, dirtyViewIds)
 * 
 * ## Individual Hooks (For granular access to single values)
 * 
 * Each packaged hook also exports individual hooks for accessing single values:
 * - `useShowControls()`, `useSetShowControls()`, etc.
 * - `useZoom()`, `useSetZoom()`, etc.
 * - `useMapId()`, `useMapRef()`, etc.
 * - `useViewId()`, `useSetViewId()`, etc.
 * 
 * ## Usage Examples
 * 
 * ```tsx
 * // Use packaged hook when you need multiple related values
 * const { showControls, setShowControls, pinDropMode } = useMapControls();
 * 
 * // Use individual hooks for single values (better performance)
 * const mapRef = useMapRef();
 * const zoom = useZoom();
 * ```
 */

// Re-export packaged hooks for cleaner API
export { useMapControls } from "./useMapControls";
export { useMapCamera } from "./useMapCamera";
export { useMapCore } from "./useMapCore";
export { useMapViewState } from "./useMapViewState";

// Re-export individual hooks for backward compatibility and granular access
export {
  useShowControls,
  useShowControlsAtom,
  useSetShowControls,
  usePinDropMode,
  usePinDropModeAtom,
  useSetPinDropMode,
} from "./useMapControls";

export { useZoom, useZoomAtom, useSetZoom } from "./useMapCamera";

export {
  useMapId,
  useMapIdAtom,
  useSetMapId,
  useMapRef,
  useMapRefAtom,
  useSetMapRef,
} from "./useMapCore";

export {
  useViewId,
  useViewIdAtom,
  useSetViewId,
  useDirtyViewIds,
  useDirtyViewIdsAtom,
  useSetDirtyViewIds,
} from "./useMapViewState";

