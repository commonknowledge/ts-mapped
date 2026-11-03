"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { useTRPC } from "@/services/trpc/react";
import { buildDefaultInspectorConfig } from "../components/InspectorPanel/utils";
import { useAreaSettings } from "./useAreaSettings";
import { useMapConfig } from "./useMapConfig";
import { useMapId } from "./useMapCore";
import { useViewId } from "./useMapViews";
import { useSavedVisualisations } from "./useSavedVisualisations";
import { useUpdateInspectorConfig } from "./useUpdateInspectorConfig";
import type { InspectorConfig } from "./useUpdateInspectorConfig";

const unique = (ids: string[]) => [...new Set(ids.filter(Boolean))];

const sameOrder = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * The inspector's location-data sections, following the view's Areas list.
 * Each data source in the list gets a section automatically; the view
 * config records only the user's changes: hidden sections, extra sources
 * and a custom order. Marker collections are left to the Markers tab.
 *
 * Pass `sync` from exactly one mounted component (LightInspectorSync) to
 * keep the stored configs in line; several syncing at once would race.
 */
export function useInspectorLayers({ sync = false }: { sync?: boolean } = {}) {
  const mapId = useMapId();
  const viewId = useViewId();
  const trpc = useTRPC();
  const configsQuery = useQuery(
    trpc.mapView.inspectorConfigs.queryOptions(
      { mapId: mapId || "", viewId: viewId || "" },
      { enabled: Boolean(mapId) && Boolean(viewId) },
    ),
  );
  const configs = useMemo(() => configsQuery.data ?? [], [configsQuery.data]);
  // Possibly the map's, shared by its views (see useAreaSettings)
  const { areaSettings: viewConfig, updateConfig: updateViewConfig } =
    useAreaSettings();
  const { mapConfig } = useMapConfig();
  const { items } = useSavedVisualisations();
  const { data: dataSources, getDataSourceById } = useDataSources();
  const updateInspectorConfig = useUpdateInspectorConfig();

  const hidden = useMemo(
    () => viewConfig.inspectorHiddenDataSourceIds ?? [],
    [viewConfig.inspectorHiddenDataSourceIds],
  );
  const extras = useMemo(
    () => viewConfig.inspectorExtraDataSourceIds ?? [],
    [viewConfig.inspectorExtraDataSourceIds],
  );
  const areaIds = useMemo(
    () => unique(items.map((item) => item.areaDataSourceId)),
    [items],
  );

  const isMarkerLayer = useCallback(
    (dataSourceId: string) =>
      mapConfig.membersDataSourceId === dataSourceId ||
      mapConfig.markerDataSourceIds.includes(dataSourceId),
    [mapConfig.markerDataSourceIds, mapConfig.membersDataSourceId],
  );

  // Every location-data section, in inspector order, hidden ones included
  const sections = useMemo(
    () =>
      configs
        .filter((config) => !isMarkerLayer(config.dataSourceId))
        .map((config) => ({
          config,
          dataSource: getDataSourceById(config.dataSourceId),
          isHidden: hidden.includes(config.dataSourceId),
          isExtra:
            extras.includes(config.dataSourceId) &&
            !areaIds.includes(config.dataSourceId),
        })),
    [areaIds, configs, extras, getDataSourceById, hidden, isMarkerLayer],
  );

  const newConfig = useCallback(
    (dataSourceId: string, position: number): InspectorConfig | null =>
      viewId
        ? buildDefaultInspectorConfig({
            dataSourceId,
            mapViewId: viewId,
            position,
            dataSource: getDataSourceById(dataSourceId) ?? undefined,
          })
        : null,
    [getDataSourceById, viewId],
  );

  // Brings the configs in line with the Areas list and the user's changes
  const isReady = configsQuery.isSuccess && Boolean(dataSources) && viewId;
  useEffect(() => {
    if (!sync || !isReady) return;
    const auto = viewConfig.inspectorAutoDataSourceIds ?? [];
    const wanted = unique([...areaIds, ...extras]).filter(
      (id) => !isMarkerLayer(id),
    );
    const current = configs.map((config) => config.dataSourceId);

    // Only configs this sync created are removed when they leave the list
    const stale = auto.filter((id) => !wanted.includes(id));
    const missing = wanted.filter((id) => !current.includes(id));
    let next = configs.filter((c) => !stale.includes(c.dataSourceId));
    next = [
      ...next,
      ...missing
        .map((id, i) => newConfig(id, next.length + i))
        .filter((c): c is InspectorConfig => c !== null),
    ];
    if (!viewConfig.inspectorOrderCustomised) {
      const rank = (id: string) => {
        const index = areaIds.indexOf(id);
        return index === -1 ? areaIds.length : index;
      };
      next = [...next].sort(
        (a, b) => rank(a.dataSourceId) - rank(b.dataSourceId),
      );
    }

    const nextIds = next.map((c) => c.dataSourceId);
    if (!sameOrder(nextIds, current)) {
      updateInspectorConfig(() => next);
    }
    const nextAuto = unique([
      ...auto.filter((id) => !stale.includes(id)),
      ...missing.filter((id) => areaIds.includes(id)),
    ]);
    if (!sameOrder(nextAuto, auto)) {
      updateViewConfig({ inspectorAutoDataSourceIds: nextAuto });
    }
  }, [
    areaIds,
    configs,
    extras,
    isMarkerLayer,
    isReady,
    newConfig,
    sync,
    updateInspectorConfig,
    updateViewConfig,
    viewConfig.inspectorAutoDataSourceIds,
    viewConfig.inspectorOrderCustomised,
  ]);

  const setHidden = useCallback(
    (dataSourceId: string, isHidden: boolean) =>
      updateViewConfig({
        inspectorHiddenDataSourceIds: isHidden
          ? unique([...hidden, dataSourceId])
          : hidden.filter((id) => id !== dataSourceId),
      }),
    [hidden, updateViewConfig],
  );

  const addExtra = useCallback(
    (dataSourceId: string) =>
      updateViewConfig({
        inspectorExtraDataSourceIds: unique([...extras, dataSourceId]),
        inspectorHiddenDataSourceIds: hidden.filter(
          (id) => id !== dataSourceId,
        ),
      }),
    [extras, hidden, updateViewConfig],
  );

  // Sources you added go; sources from the Areas list are hidden instead
  const removeSection = useCallback(
    (dataSourceId: string) => {
      if (areaIds.includes(dataSourceId)) {
        setHidden(dataSourceId, true);
        return;
      }
      updateViewConfig({
        inspectorExtraDataSourceIds: extras.filter((id) => id !== dataSourceId),
      });
      updateInspectorConfig((current) =>
        current.filter((c) => c.dataSourceId !== dataSourceId),
      );
    },
    [areaIds, extras, setHidden, updateInspectorConfig, updateViewConfig],
  );

  const move = useCallback(
    (dataSourceId: string, direction: -1 | 1) => {
      const from = configs.findIndex((c) => c.dataSourceId === dataSourceId);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= configs.length) return;
      updateInspectorConfig((current) => {
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      if (!viewConfig.inspectorOrderCustomised) {
        updateViewConfig({ inspectorOrderCustomised: true });
      }
    },
    [
      configs,
      updateInspectorConfig,
      updateViewConfig,
      viewConfig.inspectorOrderCustomised,
    ],
  );

  /** Moves a section to where another one is, e.g. by dragging its tab */
  const moveTo = useCallback(
    (dataSourceId: string, targetDataSourceId: string) => {
      if (dataSourceId === targetDataSourceId) return;
      updateInspectorConfig((current) => {
        const from = current.findIndex((c) => c.dataSourceId === dataSourceId);
        const to = current.findIndex(
          (c) => c.dataSourceId === targetDataSourceId,
        );
        if (from === -1 || to === -1) return current;
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      if (!viewConfig.inspectorOrderCustomised) {
        updateViewConfig({ inspectorOrderCustomised: true });
      }
    },
    [
      updateInspectorConfig,
      updateViewConfig,
      viewConfig.inspectorOrderCustomised,
    ],
  );

  /** Drops every customisation: the inspector follows the layers again */
  const reset = useCallback(() => {
    updateViewConfig({
      inspectorHiddenDataSourceIds: [],
      inspectorExtraDataSourceIds: [],
      inspectorOrderCustomised: false,
    });
    updateInspectorConfig((current) =>
      current.filter(
        (c) =>
          !extras.includes(c.dataSourceId) || areaIds.includes(c.dataSourceId),
      ),
    );
  }, [areaIds, extras, updateInspectorConfig, updateViewConfig]);

  const isCustomised =
    hidden.length > 0 ||
    extras.length > 0 ||
    Boolean(viewConfig.inspectorOrderCustomised);

  return {
    sections,
    isCustomised,
    setHidden,
    addExtra,
    removeSection,
    move,
    moveTo,
    reset,
  };
}
