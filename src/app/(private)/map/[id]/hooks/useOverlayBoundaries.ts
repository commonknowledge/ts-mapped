"use client";

import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { AreaSetCode } from "@/models/AreaSet";
import { CHOROPLETH_AREA_SET_CODES } from "../components/Choropleth/configs";
import { useMapViews } from "./useMapViews";
import type { OverlayBoundary } from "@/models/MapView";

// Views from before the list existed have one overlay and no id
const LEGACY_ID = "legacy";

/**
 * The view's overlay boundaries: any number of outline-only boundary sets,
 * each with its own colour and visibility. The first visible one is kept in
 * secondaryAreaSetCode / secondaryBoundaryStrokeColor, so hover, the
 * inspector and the classic editor still see a single overlay.
 */
export function useOverlayBoundaries() {
  const { viewConfig, updateViewConfig } = useMapViews();

  const items = useMemo((): OverlayBoundary[] => {
    if (viewConfig.overlayBoundaries) return viewConfig.overlayBoundaries;
    if (!viewConfig.secondaryAreaSetCode) return [];
    return [
      {
        id: LEGACY_ID,
        areaSetCode: viewConfig.secondaryAreaSetCode,
        color: viewConfig.secondaryBoundaryStrokeColor ?? undefined,
        visible: true,
      },
    ];
  }, [
    viewConfig.overlayBoundaries,
    viewConfig.secondaryAreaSetCode,
    viewConfig.secondaryBoundaryStrokeColor,
  ]);

  // Saves the list and the mirrored single overlay in one update
  const save = useCallback(
    (list: OverlayBoundary[]) => {
      const primary = list.find((item) => item.visible) ?? null;
      updateViewConfig({
        overlayBoundaries: list,
        secondaryAreaSetCode: primary?.areaSetCode ?? null,
        secondaryBoundaryStrokeColor: primary?.color ?? null,
      });
    },
    [updateViewConfig],
  );

  const add = useCallback(() => {
    const used = new Set(items.map((item) => item.areaSetCode));
    // Regions first, as the most common overlay, then any set not shown yet
    const areaSetCode =
      [AreaSetCode.UKR18, ...CHOROPLETH_AREA_SET_CODES].find(
        (code) => !used.has(code),
      ) ?? AreaSetCode.UKR18;
    save([...items, { id: uuidv4(), areaSetCode, visible: true }]);
  }, [items, save]);

  const update = useCallback(
    (id: string, patch: Partial<Omit<OverlayBoundary, "id">>) =>
      save(
        items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    [items, save],
  );

  const remove = useCallback(
    (id: string) => save(items.filter((item) => item.id !== id)),
    [items, save],
  );

  return { items, add, update, remove };
}
