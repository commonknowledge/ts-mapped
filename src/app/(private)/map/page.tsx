"use client";

import { useEffect, useRef, useState } from "react";
import { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MarkerData } from "@/types";
import Choropleth from "./components/Choropleth";
import Controls, { MapConfig } from "./components/Controls";
import Map from "./components/Map";
import Markers from "./components/Markers";
import {
  useAreaStatsQuery,
  useDataSourcesQuery,
  useMarkersQuery,
} from "./data";
import styles from "./page.module.css";
import { getChoroplethLayerConfig } from "./sources";

const DEFAULT_ZOOM = 5;

export default function MapPage() {
  /* Map state */
  const mapRef = useRef<MapRef>(null);
  // Storing the last loaded source triggers re-renders when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  /* Controls State */
  const [mapConfig, setMapConfig] = useState<MapConfig>(new MapConfig());

  // The Map layer is defined by the user config and the zoom level
  const choroplethLayerConfig = getChoroplethLayerConfig(
    mapConfig.areaSetGroupCode,
    zoom,
  );

  /* GraphQL data */
  const { data: dataSourcesData, loading: dataSourcesLoading } =
    useDataSourcesQuery();

  const { data: markersData, loading: markersLoading } = useMarkersQuery({
    dataSourceId: mapConfig.markersDataSourceId,
  });

  const {
    data: areaStatsData,
    loading: areaStatsLoading,
    fetchMore: areaStatsFetchMore,
  } = useAreaStatsQuery({
    areaSetCode: choroplethLayerConfig.areaSetCode,
    dataSourceId: mapConfig.areaDataSourceId,
    column: mapConfig.areaDataColumn,
    useDummyBoundingBox: choroplethLayerConfig.requiresBoundingBox,
  });

  /* Set Mapbox feature state on receiving new AreaStats */
  useEffect(() => {
    if (!areaStatsData) {
      return;
    }

    if (mapRef.current?.getSource(choroplethLayerConfig.mapbox.sourceId)) {
      mapRef.current?.removeFeatureState({
        source: choroplethLayerConfig.mapbox.sourceId,
        sourceLayer: choroplethLayerConfig.mapbox.layerId,
      });
    }

    areaStatsData.areaStats.stats.forEach((stat) => {
      mapRef.current?.setFeatureState(
        {
          source: choroplethLayerConfig.mapbox.sourceId,
          sourceLayer: choroplethLayerConfig.mapbox.layerId,
          id: stat.areaCode,
        },
        stat,
      );
    });
  }, [areaStatsData, lastLoadedSourceId, choroplethLayerConfig]);

  const loading = areaStatsLoading || dataSourcesLoading || markersLoading;
  return (
    <div className={styles.map}>
      <Map
        onClickMarker={(markerData) => setSelectedMarker(markerData)}
        onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
        onMoveEnd={async (boundingBox, zoom) => {
          setZoom(zoom);
          if (boundingBox && choroplethLayerConfig.requiresBoundingBox) {
            await areaStatsFetchMore({ variables: { boundingBox } });
          }
        }}
        ref={mapRef}
      >
        <Choropleth
          areaStats={areaStatsData?.areaStats}
          choroplethLayerConfig={choroplethLayerConfig}
        />
        <Markers
          markers={markersData?.markers}
          selectedMarker={selectedMarker}
          onCloseSelectedMarker={() => setSelectedMarker(null)}
        />
      </Map>
      <Controls
        dataSources={dataSourcesData?.dataSources || []}
        mapConfig={mapConfig}
        onChange={(nextConfig) => setMapConfig({ ...mapConfig, ...nextConfig })}
      />
      {loading ? (
        <div className={styles.loading}>
          <div></div>
        </div>
      ) : null}
    </div>
  );
}
