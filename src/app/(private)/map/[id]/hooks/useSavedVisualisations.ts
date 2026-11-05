"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDataSources } from "@/hooks/useDataSources";
import { AreaSetGroupCode } from "@/models/AreaSet";
import { ColorScheme } from "@/models/MapView";
import { DEFAULT_CALCULATION_TYPE } from "@/models/shared";
import {
  getClosestAreaSetGroupCode,
  getValidAreaSetGroupCodes,
} from "../components/Choropleth/areas";
import { getDefaultAreaSetGroupCode } from "../components/Choropleth/configs";
import {
  getVisualisationKey,
  isSameVisualisation,
  snapshotVisualisation,
} from "../utils/mapView";
import { useAreaSettings } from "./useAreaSettings";
import { useMapId } from "./useMapCore";
import { useMapQuery } from "./useMapQuery";
import { useMapViews } from "./useMapViews";
import type { MapViewConfig, SavedVisualisation } from "@/models/MapView";

interface NewVisualisation {
  dataSourceId?: string;
  column?: string;
  /** A second column, for a bivariate map of the two */
  secondaryColumn?: string;
  customColor?: string;
}

// Views from before the list existed have a live visualisation but no id
const UNSAVED_ID = "unsaved";

// The live view-config fields a saved visualisation restores. Its boundaries
// are skipped when the view's boundaries are locked, and for entries saved
// before boundaries were stored.
const toLiveConfig = (
  item: SavedVisualisation | null,
  boundariesLocked = false,
) => ({
  ...(!boundariesLocked && item?.areaSetGroupCode !== undefined
    ? { areaSetGroupCode: item.areaSetGroupCode }
    : {}),
  areaDataSourceId: item?.areaDataSourceId ?? "",
  areaDataColumn: item?.areaDataColumn ?? "",
  areaDataSecondaryColumn: item?.areaDataSecondaryColumn,
  calculationType: item?.calculationType ?? DEFAULT_CALCULATION_TYPE,
  colorScheme: item?.colorScheme ?? null,
  reverseColorScheme: item?.reverseColorScheme ?? null,
  colorScaleType: item?.colorScaleType,
  customColor: item?.customColor,
  includeColumnsString: item?.includeColumnsString,
});

/**
 * The list of visualisations (data source + column) to switch between: the
 * view's own, or in the light editor the map's, shared by its views.
 * The active one is the view's live choropleth config; switching saves its
 * current settings back to the list and loads the chosen one.
 */
export function useSavedVisualisations() {
  const { viewConfig } = useMapViews();
  // The list may be the map's (shared by its views); which one is on is
  // always this view's. updateConfig sends each field to the right place.
  const { areaSettings, updateConfig: updateViewConfig } = useAreaSettings();
  const { getDataSourceById } = useDataSources();
  const saved = useMemo(
    () => areaSettings.savedVisualisations ?? [],
    [areaSettings.savedVisualisations],
  );

  const boundariesLocked = Boolean(viewConfig.boundariesLocked);
  const lockedBoundary =
    viewConfig.lockedAreaSetGroupCode ?? viewConfig.areaSetGroupCode ?? null;
  const hasLive = Boolean(viewConfig.areaDataSourceId);
  // The view's entry: by id, else (views from before the list was shared)
  // the map's entry showing the same source and columns
  const liveKey = getVisualisationKey(viewConfig);
  const activeId = hasLive
    ? viewConfig.activeVisualisationId &&
      saved.some((item) => item.id === viewConfig.activeVisualisationId)
      ? viewConfig.activeVisualisationId
      : (saved.find((item) => getVisualisationKey(item) === liveKey)?.id ??
        viewConfig.activeVisualisationId ??
        UNSAVED_ID)
    : null;

  // The active entry's live settings. While boundaries are locked the live
  // boundaries are the view's, so the entry keeps its own for unlocking.
  const getLive = useCallback(
    (id: string): SavedVisualisation => {
      const live = snapshotVisualisation(viewConfig, id);
      if (!boundariesLocked) return live;
      const previous = saved.find((item) => item.id === id);
      return { ...live, areaSetGroupCode: previous?.areaSetGroupCode };
    },
    [boundariesLocked, saved, viewConfig],
  );

  // Saved entries, with the active one showing its live settings
  const items = useMemo(() => {
    if (!activeId) return saved;
    const live = getLive(activeId);
    return saved.some((item) => item.id === activeId)
      ? saved.map((item) => (item.id === activeId ? live : item))
      : [live, ...saved];
  }, [activeId, getLive, saved]);

  // The list with the live settings written back, ready to switch away, and
  // the id the active entry was saved under
  const saveLive = useCallback((): {
    list: SavedVisualisation[];
    id: string | null;
  } => {
    if (!activeId) return { list: saved, id: null };
    const id = activeId === UNSAVED_ID ? uuidv4() : activeId;
    const live = getLive(id);
    const list = saved.some((item) => item.id === id)
      ? saved.map((item) => (item.id === id ? live : item))
      : [live, ...saved];
    return { list, id };
  }, [activeId, getLive, saved]);

  const withLiveSaved = useCallback(() => saveLive().list, [saveLive]);

  // Boundaries a visualisation fits: when locked, the locked ones or the
  // closest level that fits; otherwise the current ones if the data can be
  // grouped by them, else the data's own geography. Chosen in the same
  // update as the visualisation, as consecutive updates overwrite each other.
  const getBoundariesFor = useCallback(
    (dataSourceId: string | undefined) => {
      const current = viewConfig.areaSetGroupCode ?? null;
      const geocodingConfig = dataSourceId
        ? getDataSourceById(dataSourceId)?.geocodingConfig
        : null;
      // Locked: the chosen boundaries, or the closest level the data fits
      if (boundariesLocked) {
        return getClosestAreaSetGroupCode({
          target: lockedBoundary ?? AreaSetGroupCode.WMC24,
          geocodingConfig,
        });
      }
      if (!dataSourceId) return current ?? AreaSetGroupCode.WMC24;
      const valid = getValidAreaSetGroupCodes(geocodingConfig);
      if (current && valid.includes(current)) return current;
      const areaSetCode =
        geocodingConfig && "areaSetCode" in geocodingConfig
          ? geocodingConfig.areaSetCode
          : null;
      return (
        (areaSetCode ? getDefaultAreaSetGroupCode(areaSetCode) : null) ??
        valid[0] ??
        AreaSetGroupCode.WMC24
      );
    },
    [
      boundariesLocked,
      getDataSourceById,
      lockedBoundary,
      viewConfig.areaSetGroupCode,
    ],
  );

  const select = useCallback(
    (id: string, overrides: Partial<MapViewConfig> = {}) => {
      if (id === activeId && !Object.keys(overrides).length) return;
      const list = withLiveSaved();
      const item = list.find((v) => v.id === id) ?? null;
      updateViewConfig({
        savedVisualisations: list,
        activeVisualisationId: item?.id,
        ...toLiveConfig(item, boundariesLocked),
        ...(boundariesLocked && item
          ? { areaSetGroupCode: getBoundariesFor(item.areaDataSourceId) }
          : {}),
        ...overrides,
      });
    },
    [
      activeId,
      boundariesLocked,
      getBoundariesFor,
      updateViewConfig,
      withLiveSaved,
    ],
  );

  /** Locking makes the view's boundaries apply to every visualisation;
   *  unlocking restores the active visualisation's own */
  const setBoundariesLocked = useCallback(
    (locked: boolean) => {
      if (locked) {
        // Record the active entry's own boundaries before they're overridden
        const { list, id } = saveLive();
        updateViewConfig({
          boundariesLocked: true,
          lockedAreaSetGroupCode: viewConfig.areaSetGroupCode ?? null,
          savedVisualisations: list,
          ...(id ? { activeVisualisationId: id } : {}),
        });
        return;
      }
      const own = saved.find((item) => item.id === activeId)?.areaSetGroupCode;
      updateViewConfig({
        boundariesLocked: false,
        lockedAreaSetGroupCode: null,
        ...(own !== undefined ? { areaSetGroupCode: own } : {}),
      });
    },
    [activeId, saveLive, saved, updateViewConfig, viewConfig.areaSetGroupCode],
  );

  /** Changes the locked boundaries; the map uses them, or the closest level
   *  the active visualisation's data fits */
  const setLockedBoundary = useCallback(
    (code: AreaSetGroupCode | null) => {
      const geocodingConfig = viewConfig.areaDataSourceId
        ? getDataSourceById(viewConfig.areaDataSourceId)?.geocodingConfig
        : null;
      updateViewConfig({
        lockedAreaSetGroupCode: code,
        areaSetGroupCode:
          code && viewConfig.areaDataSourceId
            ? getClosestAreaSetGroupCode({ target: code, geocodingConfig })
            : code,
      });
    },
    [getDataSourceById, updateViewConfig, viewConfig.areaDataSourceId],
  );

  /** The view's boundaries: a set, none (which turns the visualisation
   *  off), or lists only. Always the global ones when locked. */
  const setViewBoundaries = useCallback(
    ({
      code,
      listsOnly = false,
    }: {
      code: AreaSetGroupCode | null;
      listsOnly?: boolean;
    }) => {
      if (!code) {
        updateViewConfig({
          savedVisualisations: withLiveSaved(),
          activeVisualisationId: undefined,
          ...toLiveConfig(null),
          areaSetGroupCode: null,
          boundariesListsOnly: listsOnly,
          ...(boundariesLocked ? { lockedAreaSetGroupCode: null } : {}),
        });
        return;
      }
      const geocodingConfig = viewConfig.areaDataSourceId
        ? getDataSourceById(viewConfig.areaDataSourceId)?.geocodingConfig
        : null;
      updateViewConfig({
        boundariesListsOnly: false,
        ...(boundariesLocked
          ? {
              lockedAreaSetGroupCode: code,
              areaSetGroupCode: viewConfig.areaDataSourceId
                ? getClosestAreaSetGroupCode({ target: code, geocodingConfig })
                : code,
            }
          : { areaSetGroupCode: code }),
      });
    },
    [
      boundariesLocked,
      getDataSourceById,
      updateViewConfig,
      viewConfig.areaDataSourceId,
      withLiveSaved,
    ],
  );

  /** Whether a data source can be shown on the locked boundaries as they are */
  const fitsLockedBoundary = useCallback(
    (dataSourceId: string) =>
      !boundariesLocked ||
      !lockedBoundary ||
      getValidAreaSetGroupCodes(
        getDataSourceById(dataSourceId)?.geocodingConfig,
      ).includes(lockedBoundary),
    [boundariesLocked, getDataSourceById, lockedBoundary],
  );

  /** Saves the current visualisation and starts a new one, optionally on a
   *  given data source and column, for the user to finish in the flyout */
  const startNew = useCallback(
    ({
      dataSourceId,
      column,
      secondaryColumn,
      customColor,
    }: NewVisualisation = {}) => {
      // Library data opens on its default column (e.g. the election
      // results' winning party) unless a column was asked for
      const ds = dataSourceId ? getDataSourceById(dataSourceId) : null;
      const libraryDefault =
        !column && ds?.public ? ds.defaultChoroplethConfig : null;
      updateViewConfig({
        savedVisualisations: withLiveSaved(),
        activeVisualisationId: uuidv4(),
        ...toLiveConfig(null),
        areaSetGroupCode: getBoundariesFor(dataSourceId),
        areaDataSourceId: dataSourceId ?? "",
        areaDataColumn: column ?? libraryDefault?.column ?? "",
        ...(libraryDefault
          ? { calculationType: libraryDefault.calculationType }
          : {}),
        areaDataSecondaryColumn: secondaryColumn,
        // A single-colour scale, e.g. a marker layer's own colour
        ...(customColor
          ? { colorScheme: ColorScheme.Custom, customColor }
          : {}),
      });
    },
    [getBoundariesFor, getDataSourceById, updateViewConfig, withLiveSaved],
  );

  /** Sets the active visualisation's data source, with boundaries that fit
   *  it and a public source's default column, in one update */
  const chooseDataSource = useCallback(
    (dataSourceId: string) => {
      const ds = getDataSourceById(dataSourceId);
      const defaults =
        ds?.public && ds.defaultChoroplethConfig
          ? {
              areaDataColumn: ds.defaultChoroplethConfig.column,
              calculationType: ds.defaultChoroplethConfig.calculationType,
            }
          : { areaDataColumn: "" };
      updateViewConfig({
        // A fresh view may have no active entry yet — give it one when
        // the user picks a source from the prompt
        activeVisualisationId: viewConfig.activeVisualisationId || uuidv4(),
        areaDataSourceId: dataSourceId,
        areaDataSecondaryColumn: undefined,
        areaSetGroupCode: getBoundariesFor(dataSourceId),
        ...defaults,
      });
    },
    [
      getBoundariesFor,
      getDataSourceById,
      updateViewConfig,
      viewConfig.activeVisualisationId,
    ],
  );

  /** Shows a data source + column, reusing its list entry if there is one */
  const showOrCreate = useCallback(
    ({
      dataSourceId,
      column,
      secondaryColumn,
      customColor,
    }: NewVisualisation & { dataSourceId: string; column: string }) => {
      const existing = items.find(
        (item) =>
          item.areaDataSourceId === dataSourceId &&
          item.areaDataColumn === column &&
          (item.areaDataSecondaryColumn || undefined) === secondaryColumn,
      );
      if (existing) {
        // Give an uncoloured entry the requested colour on the way in
        select(
          existing.id,
          customColor && !existing.colorScheme
            ? { colorScheme: ColorScheme.Custom, customColor }
            : {},
        );
      } else {
        startNew({ dataSourceId, column, secondaryColumn, customColor });
      }
    },
    [items, select, startNew],
  );

  /** Turns the active visualisation off, keeping it in the list; the view
   *  goes back to plain outlines on the same boundaries */
  const deactivate = useCallback(() => {
    if (!activeId) return;
    // toLiveConfig(null) leaves areaSetGroupCode untouched
    updateViewConfig({
      savedVisualisations: withLiveSaved(),
      activeVisualisationId: undefined,
      ...toLiveConfig(null),
    });
  }, [activeId, updateViewConfig, withLiveSaved]);

  const remove = useCallback(
    (id: string) => {
      const remaining = saved.filter((item) => item.id !== id);
      if (id !== activeId) {
        updateViewConfig({ savedVisualisations: remaining });
        return;
      }
      // Removing the active one falls back to the next in the list
      const next = remaining[0] ?? null;
      updateViewConfig({
        savedVisualisations: remaining,
        activeVisualisationId: next?.id,
        ...toLiveConfig(next, boundariesLocked),
        ...(boundariesLocked && next
          ? { areaSetGroupCode: getBoundariesFor(next.areaDataSourceId) }
          : {}),
      });
    },
    [activeId, boundariesLocked, getBoundariesFor, saved, updateViewConfig],
  );

  /** Removes every entry for a data source, e.g. its whole Areas group */
  const removeSource = useCallback(
    (dataSourceId: string) => {
      const remaining = saved.filter(
        (item) => item.areaDataSourceId !== dataSourceId,
      );
      const activeGoes =
        viewConfig.areaDataSourceId === dataSourceId && Boolean(activeId);
      if (!activeGoes) {
        updateViewConfig({ savedVisualisations: remaining });
        return;
      }
      const next = remaining[0] ?? null;
      updateViewConfig({
        savedVisualisations: remaining,
        activeVisualisationId: next?.id,
        ...toLiveConfig(next, boundariesLocked),
        ...(boundariesLocked && next
          ? { areaSetGroupCode: getBoundariesFor(next.areaDataSourceId) }
          : {}),
      });
    },
    [
      activeId,
      boundariesLocked,
      getBoundariesFor,
      saved,
      updateViewConfig,
      viewConfig.areaDataSourceId,
    ],
  );

  /** Moves a data source's group to where another's is. The inspector's
   *  tabs follow this order, so it stops being customised separately. */
  const moveSource = useCallback(
    (dataSourceId: string, targetDataSourceId: string) => {
      if (dataSourceId === targetDataSourceId) return;
      const { list, id } = saveLive();
      const order = [...new Set(list.map((item) => item.areaDataSourceId))];
      const from = order.indexOf(dataSourceId);
      const to = order.indexOf(targetDataSourceId);
      if (from === -1 || to === -1) return;
      order.splice(from, 1);
      order.splice(to, 0, dataSourceId);
      const sorted = order.flatMap((source) =>
        list.filter((item) => item.areaDataSourceId === source),
      );
      updateViewConfig({
        savedVisualisations: sorted,
        ...(id ? { activeVisualisationId: id } : {}),
        inspectorOrderCustomised: false,
      });
    },
    [saveLive, updateViewConfig],
  );

  return {
    items,
    activeId,
    removeSource,
    moveSource,
    select,
    startNew,
    showOrCreate,
    chooseDataSource,
    deactivate,
    remove,
    boundariesLocked,
    setBoundariesLocked,
    lockedBoundary,
    setLockedBoundary,
    setViewBoundaries,
    fitsLockedBoundary,
    getBoundariesFor,
    saved,
    getLive,
    saveLive,
  };
}

/**
 * Keeps the map's shared list in step with the visualisation that's on, so
 * every view sees it (with its latest settings) as soon as it's made or
 * changed, not only once another is chosen. Opening a view loads the
 * list's settings for the one it has on; one deleted from the list in
 * another view is turned off. Mount once.
 */
export function useSyncActiveVisualisation() {
  const { view } = useMapViews();
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const { isShared, updateConfig } = useAreaSettings();
  const { activeId, boundariesLocked, saved, getLive, saveLive } =
    useSavedVisualisations();
  const last = useRef<{
    viewId: string;
    live: SavedVisualisation | null;
  } | null>(null);
  // After the views' own lists have been gathered into the map's
  const ready = isShared && Boolean(map?.config.visualisationsMergedFromViews);

  useEffect(() => {
    if (!ready || !view) return;
    const live = activeId ? getLive(activeId) : null;
    const previous = last.current;
    const entry = activeId
      ? saved.find((item) => item.id === activeId)
      : undefined;

    // First observation only seeds the ref. Treating it as a view switch
    // would clear a visualisation that was just created (not yet in the
    // shared list), which made "Create data visualisation" need two clicks.
    if (!previous) {
      last.current = { viewId: view.id, live };
      if (activeId && live && !entry) {
        const { list, id } = saveLive();
        updateConfig({
          savedVisualisations: list,
          ...(id ? { activeVisualisationId: id } : {}),
        });
      }
      return;
    }

    last.current = { viewId: view.id, live };
    if (!activeId || !live) return;

    if (previous.viewId !== view.id) {
      if (!entry) {
        updateConfig({
          activeVisualisationId: undefined,
          ...toLiveConfig(null),
        });
      } else if (!isSameVisualisation(entry, live)) {
        updateConfig({
          activeVisualisationId: entry.id,
          ...toLiveConfig(entry, boundariesLocked),
        });
      }
      return;
    }

    // Changed here (or just made): write it back to the list
    if (entry && isSameVisualisation(entry, live)) return;
    if (entry && previous.live && isSameVisualisation(previous.live, live)) {
      return;
    }
    const { list, id } = saveLive();
    updateConfig({
      savedVisualisations: list,
      ...(id ? { activeVisualisationId: id } : {}),
    });
  }, [
    activeId,
    boundariesLocked,
    getLive,
    ready,
    saveLive,
    saved,
    updateConfig,
    view,
  ]);
}
