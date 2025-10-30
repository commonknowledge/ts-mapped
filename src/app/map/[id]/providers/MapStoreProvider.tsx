"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { createNewViewConfig } from "@/app/map/[id]/context/MapContext";
import {
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_ID_KEY,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
  MARKER_RADIUS_KEY,
  MAX_COLUMN_KEY,
  SORT_BY_LOCATION,
  SORT_BY_NAME_COLUMNS,
} from "@/constants";
import { GeocodingType } from "@/server/models/DataSource";
import { VisualisationType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { LayerType } from "@/types";
import { getBoundaryDatasetName } from "../components/inspector/helpers";
import {
  useChoroplethDataSource,
  useDataSources,
} from "../hooks/useDataSources";
import { useMapConfig } from "../hooks/useMapConfig";
import { useMapQuery } from "../hooks/useMapQuery";
import { useMapViews } from "../hooks/useMapViews";
import { useTurfsQuery } from "../hooks/useTurfs";
import { getChoroplethLayerConfig } from "../sources";
import {
  MapStoreContext,
  createMapStore,
  useMapStore,
} from "../stores/useMapStore";
import { getNewLastPosition } from "../utils";
import type { ReactNode } from "react";

const HIDDEN_PROPERTIES = [
  MARKER_DATA_SOURCE_ID_KEY,
  MARKER_ID_KEY,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
  MARKER_RADIUS_KEY,
  MAX_COLUMN_KEY,
  SORT_BY_LOCATION,
  SORT_BY_NAME_COLUMNS,
];

export function MapStoreProvider({
  children,
  viewId: initialViewId,
}: {
  children: ReactNode;
  viewId?: string;
}) {
  const store = useMemo(
    () => createMapStore({ initialViewId }),
    [initialViewId],
  );

  return (
    <MapStoreContext value={store}>
      {children}
      <MapEffects />
    </MapStoreContext>
  );
}

function MapEffects() {
  const { id: mapId } = useParams<{ id: string }>();
  const setViewId = useMapStore((s) => s.setViewId);
  const viewId = useMapStore((s) => s.viewId);
  const selectedRecord = useMapStore((s) => s.selectedRecord);
  const selectedTurf = useMapStore((s) => s.selectedTurf);
  const selectedBoundary = useMapStore((s) => s.selectedBoundary);
  const setInspectorContent = useMapStore((s) => s.setInspectorContent);
  const zoom = useMapStore((s) => s.zoom);
  const setChoroplethLayerConfig = useMapStore(
    (s) => s.setChoroplethLayerConfig,
  );
  const setTurfVisibilityState = useMapStore((s) => s.setTurfVisibilityState);
  const setDataSourceVisibilityState = useMapStore(
    (s) => s.setDataSourceVisibilityState,
  );
  const hiddenLayers = useMapStore((s) => s.hiddenLayers);

  const mapQuery = useMapQuery();
  const { data: mapData } = mapQuery;
  const viewsInitialized = useRef(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: createDefaultViewMutate } = useMutation(
    trpc.map.updateViews.mutationOptions(),
  );

  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { viewConfig } = useMapViews();
  const choroplethDataSource = useChoroplethDataSource();
  const { data: turfs = [] } = useTurfsQuery();

  // Views initialization: create view if none exist and ensure a view is selected
  useEffect(() => {
    if (viewsInitialized.current) return;
    if (!mapData?.views) return;

    viewsInitialized.current = true;

    if (mapData?.views && mapData.views.length > 0) {
      const nextView =
        mapData.views.find((v) => v.id === viewId) || mapData.views[0];
      setViewId(nextView.id);
    } else {
      const newView = {
        id: uuidv4(),
        name: "Default View",
        config: createNewViewConfig(),
        dataSourceViews: [],
        mapId,
        position: getNewLastPosition(mapData.views),
        createdAt: new Date(),
      };
      queryClient.setQueryData(trpc.map.byId.queryKey({ mapId }), (old) => {
        if (!old) return old;
        return { ...old, views: [...old.views, newView] };
      });
      setViewId(newView.id);
      createDefaultViewMutate({ mapId, views: [newView] });
    }
  }, [
    viewId,
    mapData?.views,
    mapId,
    queryClient,
    trpc.map.byId,
    createDefaultViewMutate,
    setViewId,
  ]);

  // Compute inspector content
  useEffect(() => {
    if (!selectedRecord || !selectedRecord?.properties) {
      if (selectedTurf?.id) {
        setInspectorContent({
          type: LayerType.Turf,
          name: selectedTurf.name || "Area",
          properties: null,
          dataSource: null,
        });
      } else if (selectedBoundary?.name) {
        setInspectorContent({
          type: LayerType.Boundary,
          name: selectedBoundary.name,
          dataSource: null,
          properties: {
            ["Area Code"]: selectedBoundary?.areaCode,
            Dataset: getBoundaryDatasetName(selectedBoundary?.sourceLayerId),
          },
        });
      } else {
        setInspectorContent(null);
      }
      return;
    }

    const dataSourceId = selectedRecord?.dataSourceId;
    const dataSource = dataSourceId ? getDataSourceById(dataSourceId) : null;
    const type =
      dataSourceId === mapConfig.membersDataSourceId
        ? LayerType.Member
        : LayerType.Marker;

    const filteredProperties = Object.fromEntries(
      Object.entries(selectedRecord.properties).filter(
        ([key]) => !HIDDEN_PROPERTIES.includes(key),
      ),
    );

    setInspectorContent({
      type: type,
      name: selectedRecord?.properties?.[MARKER_NAME_KEY],
      properties: filteredProperties,
      dataSource: dataSource,
    });
  }, [
    getDataSourceById,
    selectedRecord,
    selectedTurf,
    selectedBoundary,
    mapConfig.membersDataSourceId,
    setInspectorContent,
  ]);

  // Compute choroplethLayerConfig
  const choroplethLayerConfig = useMemo(() => {
    const areaSetCode =
      choroplethDataSource?.geocodingConfig?.type === GeocodingType.Code
        ? choroplethDataSource?.geocodingConfig?.areaSetCode
        : undefined;

    return getChoroplethLayerConfig(
      viewConfig.visualisationType === VisualisationType.Choropleth
        ? areaSetCode
        : undefined,
      viewConfig.areaSetGroupCode,
      zoom,
    );
  }, [
    choroplethDataSource,
    viewConfig.areaSetGroupCode,
    viewConfig.visualisationType,
    zoom,
  ]);

  useEffect(() => {
    setChoroplethLayerConfig(choroplethLayerConfig);
  }, [choroplethLayerConfig, setChoroplethLayerConfig]);

  // Handle side effects when layers are shown/hidden
  useEffect(() => {
    // When a layer visibility changes, update visibility for all items in that layer
    if (hiddenLayers.includes(LayerType.Member)) {
      if (mapConfig.membersDataSourceId) {
        setDataSourceVisibilityState(mapConfig.membersDataSourceId, false);
      }
    } else {
      if (mapConfig.membersDataSourceId) {
        setDataSourceVisibilityState(mapConfig.membersDataSourceId, true);
      }
    }
  }, [
    hiddenLayers,
    mapConfig.membersDataSourceId,
    setDataSourceVisibilityState,
  ]);

  useEffect(() => {
    // When turf layer visibility changes, update visibility for all turfs
    const isTurfLayerHidden = hiddenLayers.includes(LayerType.Turf);
    turfs.forEach((t) => setTurfVisibilityState(t.id, !isTurfLayerHidden));
  }, [hiddenLayers, turfs, setTurfVisibilityState]);
  return null;
}
