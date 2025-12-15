"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { drawAtom } from "../atoms/mapStateAtoms";
import { turfVisibilityAtom } from "../atoms/turfAtoms";
import { useMapControls } from "./useMapControls";
import { useMapRef } from "./useMapCore";
import { useTurfsQuery } from "./useTurfsQuery";
import type { DrawModeChangeEvent } from "@/types";

export function useTurfState() {
  const mapRef = useMapRef();
  const { data: turfs = [] } = useTurfsQuery();
  const { editAreaMode, setEditAreaMode } = useMapControls();
  const draw = useAtomValue(drawAtom);

  const [turfVisibility, _setTurfVisibility] = useAtom(turfVisibilityAtom);

  // Listen to draw mode changes and update editAreaMode accordingly
  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    const handleModeChange = (e: DrawModeChangeEvent) => {
      // Set editAreaMode to true if in draw_polygon mode, false otherwise
      setEditAreaMode(e.mode === "draw_polygon");
    };

    map.on("draw.modechange", handleModeChange);

    return () => {
      map.off("draw.modechange", handleModeChange);
    };
  }, [mapRef, setEditAreaMode]);

  // When edit mode is turned off elsewhere, forcibly return draw to a neutral state
  useEffect(() => {
    if (editAreaMode) return;

    const map = mapRef?.current;
    if (map) {
      map.getCanvas().style.cursor = "";
    }

    if (draw) {
      (draw.changeMode as (mode: string, opts?: object) => void)(
        "simple_select",
        { featureIds: [] },
      );
    }

    const drawButton = document.querySelector(
      ".mapbox-gl-draw_polygon",
    ) as HTMLButtonElement | null;
    if (drawButton) {
      drawButton.classList.remove("active");
      drawButton.setAttribute("aria-pressed", "false");
    }
  }, [draw, editAreaMode, mapRef]);

  const setTurfVisibility = useCallback(
    (turfId: string, isVisible: boolean) => {
      _setTurfVisibility((prev) => ({ ...prev, [turfId]: isVisible }));
    },
    [_setTurfVisibility],
  );

  const getTurfVisibility = useCallback(
    (turfId: string): boolean => {
      return turfVisibility[turfId] ?? true;
    },
    [turfVisibility],
  );

  const visibleTurfs = useMemo(() => {
    return turfs.filter((turf) => {
      return getTurfVisibility(turf.id);
    });
  }, [turfs, getTurfVisibility]);

  const handleAddArea = useCallback(() => {
    const map = mapRef?.current;
    if (map) {
      // Find the polygon draw button and click it
      const drawButton = document.querySelector(
        ".mapbox-gl-draw_polygon",
      ) as HTMLButtonElement;
      if (drawButton) {
        drawButton.click();
      }
    }
  }, [mapRef]);

  const cancelDrawMode = useCallback(() => {
    const map = mapRef?.current;
    if (map) {
      // Reset the map cursor first
      map.getCanvas().style.cursor = "";
    }

    if (draw) {
      // Use MapboxDraw's changeMode to exit draw_polygon mode
      // This should fire draw.modechange, but also set the state directly as a fallback
      (draw.changeMode as (mode: string) => void)("simple_select");
    }

    // Explicitly reset the edit mode flag in case the modechange event does not fire
    setEditAreaMode(false);
  }, [draw, mapRef, setEditAreaMode]);

  return {
    editAreaMode,
    setEditAreaMode,
    visibleTurfs,
    handleAddArea,
    cancelDrawMode,
    turfVisibility,
    setTurfVisibility,
    getTurfVisibility,
  };
}
