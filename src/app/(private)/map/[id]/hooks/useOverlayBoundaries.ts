"use client";

import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { AreaSetCode } from "@/models/AreaSet";
import { CHOROPLETH_AREA_SET_CODES } from "../components/Choropleth/configs";
import { useAreaSettings } from "./useAreaSettings";
import { useMapViews } from "./useMapViews";
import type { OverlayBoundary } from "@/models/MapView";

// Views from before the list existed have one overlay and no id
const LEGACY_ID = "legacy";

/**
 * The overlay boundaries: any number of outline-only boundary sets, each
 * with its own colour and visibility. In the light editor the list is the
 * map's, shared by its views, and only visibility is per view. The first
 * visible one is kept in secondaryAreaSetCode / secondaryBoundaryStrokeColor,
 * so hover, the inspector and the classic editor still see a single overlay.
 */
export function useOverlayBoundaries() {
  const { viewConfig } = useMapViews();
  const { areaSettings, updateConfig, isShared } = useAreaSettings();
  const visibility = viewConfig.overlayBoundaryVisibility;

  // The list as stored, without this view's visibility
  const stored = useMemo((): OverlayBoundary[] => {
    if (areaSettings.overlayBoundaries) return areaSettings.overlayBoundaries;
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
    areaSettings.overlayBoundaries,
    viewConfig.secondaryAreaSetCode,
    viewConfig.secondaryBoundaryStrokeColor,
  ]);

  const items = useMemo(
    () =>
      isShared
        ? stored.map((item) => ({
            ...item,
            visible: visibility?.[item.id] ?? item.visible,
          }))
        : stored,
    [isShared, stored, visibility],
  );

  // Saves the list, this view's visibility and the mirrored single overlay
  // in one update (split between map and view when shared)
  const save = useCallback(
    (list: OverlayBoundary[]) => {
      const primary = list.find((item) => item.visible) ?? null;
      updateConfig({
        overlayBoundaries: isShared
          ? list.map((item) => ({
              ...item,
              // The shared default for views that haven't chosen
              visible:
                stored.find((s) => s.id === item.id)?.visible ?? item.visible,
            }))
          : list,
        ...(isShared
          ? {
              overlayBoundaryVisibility: Object.fromEntries(
                list.map((item) => [item.id, item.visible]),
              ),
            }
          : {}),
        secondaryAreaSetCode: primary?.areaSetCode ?? null,
        secondaryBoundaryStrokeColor: primary?.color ?? null,
      });
    },
    [isShared, stored, updateConfig],
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
