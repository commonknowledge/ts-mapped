"use client";

import { useAtomValue } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useCallback, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { areasSharedAcrossViewsAtom } from "../atoms/mapStateAtoms";
import { mergeViewVisualisations } from "../utils/mapView";
import { useMapConfig } from "./useMapConfig";
import { useMapId } from "./useMapCore";
import { useMapQuery } from "./useMapQuery";
import { useMapViews } from "./useMapViews";
import type { MapViewConfig } from "@/models/MapView";

// Settings that can live on the map (shared by every view) instead of on
// each view; the names match on both
const SHARED_KEYS = [
  "savedVisualisations",
  "overlayBoundaries",
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
      overlayBoundaries:
        mapConfig.overlayBoundaries ?? viewConfig.overlayBoundaries,
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
 * Locks the view's boundaries the first time the light editor opens it,
 * so every visualisation shares one set (the simpler default). Mount once.
 */
export function useAdoptGlobalBoundaries() {
  const { view, viewConfig, updateViewConfig } = useMapViews();

  useEffect(() => {
    if (!view || viewConfig.boundariesLocked !== undefined) return;
    updateViewConfig({
      boundariesLocked: true,
      lockedAreaSetGroupCode: viewConfig.areaSetGroupCode ?? null,
    });
  }, [
    updateViewConfig,
    view,
    viewConfig.areaSetGroupCode,
    viewConfig.boundariesLocked,
  ]);
}

/**
 * Makes the map's list the list of every view: the first time a map's
 * views share their settings it takes them from the view that's open, and
 * the visualisations from all its views (each's saved ones and the one it
 * has on), so every view shows the same list at once. Maps that took only
 * one view's are repaired the same way. Mount once.
 */
export function useAdoptViewAreaSettings() {
  const isShared = useAtomValue(areasSharedAcrossViewsAtom);
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const { viewConfig, view } = useMapViews();
  const { updateMapConfig } = useMapConfig();

  const mapList = map?.config.savedVisualisations;
  const views = map?.views;
  const merged = useMemo(
    () =>
      views
        ? mergeViewVisualisations({
            mapList: mapList ?? [],
            views: views.map((v) => v.config),
            newId: uuidv4,
          })
        : null,
    [mapList, views],
  );
  const isFirstTime = mapList === undefined;
  // Once per map: after that, a visualisation deleted from the list stays
  // gone even if a view still had it on
  const needsMerging = !map?.config.visualisationsMergedFromViews;

  useEffect(() => {
    if (!isShared || !map || !view || !merged) return;
    if (!needsMerging) return;
    updateMapConfig(
      isFirstTime
        ? {
            savedVisualisations: merged,
            visualisationsMergedFromViews: true,
            overlayBoundaries: viewConfig.overlayBoundaries,
            inspectorHiddenDataSourceIds:
              viewConfig.inspectorHiddenDataSourceIds,
            inspectorExtraDataSourceIds: viewConfig.inspectorExtraDataSourceIds,
            inspectorAutoDataSourceIds: viewConfig.inspectorAutoDataSourceIds,
            inspectorOrderCustomised: viewConfig.inspectorOrderCustomised,
            inspectorRecordNameColumns: viewConfig.inspectorRecordNameColumns,
          }
        : { savedVisualisations: merged, visualisationsMergedFromViews: true },
    );
  }, [
    isFirstTime,
    isShared,
    map,
    merged,
    needsMerging,
    updateMapConfig,
    view,
    viewConfig,
  ]);
}
