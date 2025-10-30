"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
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
import {
  useChoroplethDataSource,
  useDataSources,
} from "../hooks/useDataSources";
import { useMapConfig } from "../hooks/useMapConfig";
import { useMapQuery } from "../hooks/useMapQuery";
import { useMapViews } from "../hooks/useMapViews";
import { getChoroplethLayerConfig } from "../sources";
import { createNewViewConfig, useMapStore } from "../stores/useMapStore";
import { getNewLastPosition } from "../utils";
import { getBoundaryDatasetName } from "./inspector/helpers";

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

// WE REALLY WANA DELETE THIS, DERIVE!!
export function MapEffects() {
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

  // Views initialization: create view if none exist and ensure a view is selected
  useEffect(() => {
    if (viewsInitialized.current) return;
    if (!mapData?.views) return;

    viewsInitialized.current = true;

    console.log(mapData.views);

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

  return null;
}
