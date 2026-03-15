"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  type MapMode,
  mapIdAtom,
  mapModeAtom,
  showNavbarAtom,
  viewIdAtom,
} from "../atoms/mapStateAtoms";

/**
 * Sets the map mode, viewId, showNavbar, and optionally mapId atoms on mount.
 * Since the layout hydrates mapIdAtom once via useHydrateAtoms (idempotent),
 * subsequent navigations need useSetAtom to update these values.
 */
export function useSetMapMode(
  mode: MapMode,
  viewId?: string,
  mapId?: string,
  showNavbar = true,
) {
  const setMapMode = useSetAtom(mapModeAtom);
  const setViewId = useSetAtom(viewIdAtom);
  const setMapId = useSetAtom(mapIdAtom);
  const setShowNavbar = useSetAtom(showNavbarAtom);

  useEffect(() => {
    setMapMode(mode);
    setShowNavbar(showNavbar);
  }, [mode, showNavbar, setMapMode, setShowNavbar]);

  useEffect(() => {
    if (viewId !== undefined) {
      setViewId(viewId);
    }
  }, [viewId, setViewId]);

  useEffect(() => {
    if (mapId !== undefined) {
      setMapId(mapId);
    }
  }, [mapId, setMapId]);
}
