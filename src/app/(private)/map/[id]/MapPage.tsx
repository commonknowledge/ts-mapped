"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapRef } from "react-map-gl/mapbox";
import { BoundingBoxInput, Turf } from "@/__generated__/types";
import {
  MapContext,
  ViewConfig,
} from "@/app/(private)/map/[id]/context/MapContext";
import { DEFAULT_ZOOM } from "@/constants";
import { MarkerData } from "@/types";
import Controls from "./components/controls/Controls";
import Legend from "./components/Legend";
import Loading from "./components/Loading";
import Map from "./components/Map";
import MapStyleSelector from "./components/MapStyleSelector";
import {
  useAreaStatsQuery,
  useDataSourcesQuery,
  useMapQuery,
  useMarkersQuery,
} from "./data";
import { usePlacedMarkers, useTurfs } from "./hooks";
import styles from "./MapPage.module.css";
import { getChoroplethLayerConfig } from "./sources";

export default function MapPage({ mapId }: { mapId: string }) {
  /* Map Ref */
  const mapRef = useRef<MapRef>(null);

  /* Map State */
  // Keep track of area codes that have feature state, to clean if necessary
  const areaCodesToClean = useRef<Record<string, boolean>>({});
  // Manually keep track of fetchMore loading state as the first fetchMore
  // doesn't trigger the query loading flag
  const [areaStatsLoading, setAreaStatsLoading] = useState(false);
  const [boundingBox, setBoundingBox] = useState<BoundingBoxInput | null>(null);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  // Storing the last loaded source triggers re-render when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [viewConfig, setViewConfig] = useState(new ViewConfig());
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  /* Derived State */
  const choroplethLayerConfig = useMemo(() => {
    return getChoroplethLayerConfig(viewConfig.areaSetGroupCode, zoom);
  }, [viewConfig.areaSetGroupCode, zoom]);

  /* GraphQL Data */
  const dataSourcesQuery = useDataSourcesQuery();
  const { data: mapData, loading: mapQueryLoading } = useMapQuery(mapId);

  const markersQuery = useMarkersQuery({
    dataSourceId: viewConfig.markersDataSourceId,
  });

  const areaStatsQuery = useAreaStatsQuery({
    areaSetCode: choroplethLayerConfig.areaSetCode,
    dataSourceId: viewConfig.areaDataSourceId,
    column: viewConfig.areaDataColumn,
    excludeColumns: viewConfig.getExcludeColumns(),
    useDummyBoundingBox: choroplethLayerConfig.requiresBoundingBox,
  });

  const { data: areaStatsData, fetchMore: areaStatsFetchMore } = areaStatsQuery;

  /* Persisted map features */
  const {
    turfs,
    setTurfs,
    deleteTurf,
    insertTurf,
    updateTurf,
    loading: turfsLoading,
  } = useTurfs(mapId);

  const {
    placedMarkers,
    setPlacedMarkers,
    deletePlacedMarker,
    insertPlacedMarker,
    updatePlacedMarker,
    loading: placedMarkersLoading,
  } = usePlacedMarkers(mapId);

  const updateViewConfig = (nextViewConfig: Partial<ViewConfig>) => {
    setViewConfig(new ViewConfig({ ...viewConfig, ...nextViewConfig }));
  };

  /* Effects */

  /* Update local map state when saved views are loaded from the server */
  useEffect(() => {
    if (mapData?.map?.views && mapData.map.views.length > 0) {
      const nextView = mapData.map.views[0];
      const nextViewId = nextView.id;
      // Annoying workaround to remove __typename from read-only object (breaks `new ViewConfig()`)
      const nextConfig = { ...nextView.config };
      delete nextConfig.__typename;
      setViewId(nextViewId);
      setViewConfig(new ViewConfig(nextConfig));
    }
    if (mapData?.map?.placedMarkers) {
      setPlacedMarkers(mapData.map.placedMarkers);
    }
    if (mapData?.map?.turfs) {
      setTurfs(mapData.map.turfs);
    }
  }, [mapData, setPlacedMarkers, setTurfs]);

  /* Set Mapbox feature state on receiving new AreaStats */
  useEffect(() => {
    if (!areaStatsData) {
      return;
    }

    if (mapRef?.current?.getSource(choroplethLayerConfig.mapbox.sourceId)) {
      const nextAreaCodesToClean: Record<string, boolean> = {};
      areaStatsData.areaStats?.stats.forEach((stat) => {
        mapRef?.current?.setFeatureState(
          {
            source: choroplethLayerConfig.mapbox.sourceId,
            sourceLayer: choroplethLayerConfig.mapbox.layerId,
            id: stat.areaCode,
          },
          stat,
        );
        nextAreaCodesToClean[stat.areaCode] = true;
      });
      // Remove lingering feature states
      for (const areaCode in Object.keys(areaCodesToClean.current)) {
        if (!nextAreaCodesToClean[areaCode]) {
          mapRef?.current?.removeFeatureState({
            source: choroplethLayerConfig.mapbox.sourceId,
            sourceLayer: choroplethLayerConfig.mapbox.layerId,
            id: areaCode,
          });
        }
      }
      areaCodesToClean.current = nextAreaCodesToClean;
    }
  }, [areaStatsData, choroplethLayerConfig, lastLoadedSourceId, mapRef]);

  /* Do fetchMore() (if layer needs it) when bounding box or config changes */
  useEffect(() => {
    if (!choroplethLayerConfig.requiresBoundingBox || !areaStatsFetchMore) {
      return;
    }
    (async () => {
      setAreaStatsLoading(true);
      await areaStatsFetchMore({ variables: { boundingBox } });
      setAreaStatsLoading(false);
    })();
  }, [areaStatsFetchMore, boundingBox, choroplethLayerConfig, viewConfig]);

  // Don't display any components while waiting for saved map views
  if (mapQueryLoading) {
    return (
      <div className={styles.map}>
        <Loading />
      </div>
    );
  }

  const loading =
    areaStatsLoading ||
    areaStatsQuery.loading ||
    dataSourcesQuery.loading ||
    markersQuery.loading;

  return (
    <MapContext
      value={{
        mapId,

        mapRef,

        boundingBox,
        setBoundingBox,
        editingTurf,
        setEditingTurf,
        placedMarkers,
        placedMarkersLoading,
        deletePlacedMarker,
        insertPlacedMarker,
        updatePlacedMarker,
        selectedMarker,
        setSelectedMarker,
        turfs,
        turfsLoading,
        deleteTurf,
        insertTurf,
        updateTurf,
        viewConfig,
        updateViewConfig,
        viewId,
        setViewId,
        zoom,
        setZoom,

        areaStatsQuery,
        dataSourcesQuery,
        markersQuery,

        choroplethLayerConfig,
      }}
    >
      <div className={styles.map}>
        <MapStyleSelector />
        <Controls />
        <Map onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)} />
        <Legend areaStats={areaStatsData?.areaStats} />
        {loading && <Loading />}
      </div>
    </MapContext>
  );
}
