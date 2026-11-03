"use client";

import { useAtomValue } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useCallback, useEffect, useMemo } from "react";
import { areasSharedAcrossViewsAtom } from "../atoms/mapStateAtoms";
import { useMapConfig } from "./useMapConfig";
import { useMapId } from "./useMapCore";
import { useMapQuery } from "./useMapQuery";
import { useMapViews } from "./useMapViews";
import type { MapViewConfig } from "@/models/MapView";

// Settings that can live on the map (shared by every view) instead of on
// each view; the names match on both
const SHARED_KEYS = [
  "savedVisualisations",
  "inspectorHiddenDataSourceIds",
  "inspectorExtraDataSourceIds",
  "inspectorAutoDataSourceIds",
  "inspectorOrderCustomised",
  "inspectorRecordNameColumns",
] as const;

type SharedKey = (typeof SHARED_KEYS)[number];
export type AreaSettings = Pick<MapViewConfig, SharedKey>;

const isSharedKey = (key: string): key is SharedKey =>
  SHARED_KEYS.some((shared) => shared === key);

/** Shares the Areas list and inspector settings across this map's views */
export function useHydrateAreasSharedAcrossViews() {
  useHydrateAtoms([[areasSharedAcrossViewsAtom, true]]);
}

/**
 * The Areas list and inspector settings, and a way to update view settings
 * that may include them. When shared, those fields are read from and
 * written to the map (falling back to the view's until the map has its
 * own), and everything else in an update still goes to the view.
 */
export function useAreaSettings() {
  const isShared = useAtomValue(areasSharedAcrossViewsAtom);
  const { viewConfig, updateViewConfig } = useMapViews();
  const { mapConfig, updateMapConfig } = useMapConfig();

  const areaSettings = useMemo((): AreaSettings => {
    if (!isShared) return viewConfig;
    return {
      savedVisualisations:
        mapConfig.savedVisualisations ?? viewConfig.savedVisualisations,
      inspectorHiddenDataSourceIds:
        mapConfig.inspectorHiddenDataSourceIds ??
        viewConfig.inspectorHiddenDataSourceIds,
      inspectorExtraDataSourceIds:
        mapConfig.inspectorExtraDataSourceIds ??
        viewConfig.inspectorExtraDataSourceIds,
      inspectorAutoDataSourceIds:
        mapConfig.inspectorAutoDataSourceIds ??
        viewConfig.inspectorAutoDataSourceIds,
      inspectorOrderCustomised:
        mapConfig.inspectorOrderCustomised ??
        viewConfig.inspectorOrderCustomised,
      inspectorRecordNameColumns:
        mapConfig.inspectorRecordNameColumns ??
        viewConfig.inspectorRecordNameColumns,
    };
  }, [isShared, mapConfig, viewConfig]);

  /** One update, split between the map and the view when shared (one
   *  update each, as consecutive updates to one config overwrite) */
  const updateConfig = useCallback(
    (patch: Partial<MapViewConfig>) => {
      if (!isShared) {
        updateViewConfig(patch);
        return;
      }
      const shared: Partial<AreaSettings> = {};
      const view: Partial<MapViewConfig> = {};
      for (const [key, value] of Object.entries(patch)) {
        if (isSharedKey(key)) {
          Object.assign(shared, { [key]: value });
        } else {
          Object.assign(view, { [key]: value });
        }
      }
      if (Object.keys(shared).length) updateMapConfig(shared);
      if (Object.keys(view).length) updateViewConfig(view);
    },
    [isShared, updateMapConfig, updateViewConfig],
  );

  return { areaSettings, updateConfig, isShared };
}

/**
 * The first time a map's views share their settings, the map takes them
 * from the view that's open, so every view shows the same list at once
 * rather than after the first change. Mount once.
 */
export function useAdoptViewAreaSettings() {
  const isShared = useAtomValue(areasSharedAcrossViewsAtom);
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const { viewConfig, view } = useMapViews();
  const { updateMapConfig } = useMapConfig();

  const needsAdopting =
    isShared &&
    Boolean(map) &&
    Boolean(view) &&
    map?.config.savedVisualisations === undefined;

  useEffect(() => {
    if (!needsAdopting) return;
    updateMapConfig({
      savedVisualisations: viewConfig.savedVisualisations ?? [],
      inspectorHiddenDataSourceIds: viewConfig.inspectorHiddenDataSourceIds,
      inspectorExtraDataSourceIds: viewConfig.inspectorExtraDataSourceIds,
      inspectorAutoDataSourceIds: viewConfig.inspectorAutoDataSourceIds,
      inspectorOrderCustomised: viewConfig.inspectorOrderCustomised,
      inspectorRecordNameColumns: viewConfig.inspectorRecordNameColumns,
    });
  }, [needsAdopting, updateMapConfig, viewConfig]);
}
