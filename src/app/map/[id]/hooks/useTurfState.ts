"use client";

import { useAtom } from "jotai";
import { useCallback, useContext, useMemo } from "react";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { editingTurfAtom, turfVisibilityAtom } from "../atoms/turfAtoms";
import { useTurfsQuery } from "./useTurfs";

export function useTurfState() {
  const { mapRef } = useContext(MapContext);
  const { data: turfs = [] } = useTurfsQuery();

  const [editingTurf, setEditingTurf] = useAtom(editingTurfAtom);
  const [turfVisibility, setTurfVisibility] = useAtom(turfVisibilityAtom);

  const setTurfVisibilityState = useCallback(
    (turfId: string, isVisible: boolean) => {
      setTurfVisibility((prev) => ({ ...prev, [turfId]: isVisible }));
    },
    [setTurfVisibility],
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

  return {
    editingTurf,
    setEditingTurf,
    visibleTurfs,
    handleAddArea,
    turfVisibility,
    setTurfVisibilityState,
    getTurfVisibility,
  };
}
