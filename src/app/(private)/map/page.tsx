"use client";

import { useEffect, useRef, useState } from "react";
import { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { BoundingBox } from "@/__generated__/types";
import { MarkerData, SearchResult } from "@/types";
import Choropleth from "./components/Choropleth";
import Controls from "./components/Controls";
import ControlsTab from "./components/ControlsTab";
import Layers from "./components/Layers";
import Legend from "./components/Legend";
import Map from "./components/Map";
import Markers from "./components/Markers";
import SearchHistoryMarkers from "./components/SearchHistoryMarkers";
import Settings, { MapConfig } from "./components/Settings";
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
  // Storing the last loaded source triggers re-render when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  /* Settings state */
  const [mapConfig, setMapConfig] = useState<MapConfig>(new MapConfig());

  /* Layers state */
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([
    {
      text: "Abbey Road Studios",
      coordinates: [-0.177331, 51.532005],
      timestamp: new Date(),
    },
  ]);

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
    excludeColumns: mapConfig.getExcludeColumns(),
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

  /* Do fetchMore() (if layer needs it) when bounding box or config changes */
  useEffect(() => {
    if (!choroplethLayerConfig.requiresBoundingBox) {
      return;
    }
    areaStatsFetchMore({ variables: { boundingBox } });
  }, [areaStatsFetchMore, boundingBox, choroplethLayerConfig, mapConfig]);

  const loading = areaStatsLoading || dataSourcesLoading || markersLoading;
  const markersDataSource = (dataSourcesData?.dataSources || []).find(
    (ds: { id: string }) => ds.id === mapConfig.markersDataSourceId,
  );

  return (
    <div className={styles.map}>
      <Controls>
        <ControlsTab label="Settings">
          <Settings
            dataSources={dataSourcesData?.dataSources || []}
            mapConfig={mapConfig}
            onChangeConfig={(nextConfig) =>
              setMapConfig(new MapConfig({ ...mapConfig, ...nextConfig }))
            }
          >
            <Legend areaStats={areaStatsData?.areaStats} />
          </Settings>
        </ControlsTab>
        <ControlsTab label="Layers">
          <Layers
            mapRef={mapRef}
            markers={markersData?.markers}
            markersDataSource={markersDataSource}
            searchHistory={searchHistory}
          />
        </ControlsTab>
      </Controls>
      <Map
        onClickMarker={(markerData) => setSelectedMarker(markerData)}
        onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
        onMoveEnd={async (boundingBox, zoom) => {
          setBoundingBox(boundingBox);
          setZoom(zoom);
        }}
        mapRef={mapRef}
        mapConfig={mapConfig}
        searchHistory={searchHistory}
        setSearchHistory={setSearchHistory}
      >
        <Choropleth
          areaStats={areaStatsData?.areaStats}
          choroplethLayerConfig={choroplethLayerConfig}
          mapConfig={mapConfig}
        />
        <Markers
          markers={markersData?.markers}
          selectedMarker={selectedMarker}
          onCloseSelectedMarker={() => setSelectedMarker(null)}
        />
        <SearchHistoryMarkers searchHistory={searchHistory} />
      </Map>
      {loading ? (
        <div className={styles.loading}>
          <div></div>
        </div>
      ) : null}
    </div>
  );
}
