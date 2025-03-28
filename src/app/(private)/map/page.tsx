"use client";

import { useEffect, useRef, useState } from "react";
import { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { BoundingBox } from "@/__generated__/types";
import { MarkerData, SearchResult, DrawnPolygon } from "@/types";
import Choropleth from "./components/Choropleth";
import Controls, { MapConfig } from "./components/Controls";
import Legend from "./components/Legend";
import Map from "./components/Map";
import Markers from "./components/Markers";
import {
  useAreaStatsQuery,
  useDataSourcesQuery,
  useMarkersQuery,
} from "./data";
import styles from "./page.module.css";
import { getChoroplethLayerConfig } from "./sources";
import SearchHistoryMarkers from "./components/SearchHistoryMarkers";
import TurfPolygons from "./components/TurfPolygons";

const DEFAULT_ZOOM = 5;

export default function MapPage() {
  /* Map state */
  const mapRef = useRef<MapRef>(null);
  // Storing the last loaded source triggers re-renders when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [selectedSearchMarker, setSelectedSearchMarker] =
    useState<SearchResult | null>(null);
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  /* Controls State */
  const [mapConfig, setMapConfig] = useState<MapConfig>(new MapConfig());

  // The Map layer is defined by the user config and the zoom level
  const choroplethLayerConfig = getChoroplethLayerConfig(
    mapConfig.areaSetGroupCode,
    zoom
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
        stat
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

  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([
    {
      text: "Abbey Road Studios",
      coordinates: [-0.177331, 51.532005],
      timestamp: new Date("2024-03-20T14:30:00Z"),
    },
  ]);

  const [TurfHistory, setTurfHistory] = useState<DrawnPolygon[]>([
    {
      id: "N90IVwEVjjVuYnJwwtuPSvRgVTAUgLjh",
      area: 6659289.77,
      geometry: {
        coordinates: [
          [
            [-0.09890821864360078, 51.466784423169656],
            [-0.050307845722869615, 51.457615269748146],
            [-0.06844742153057837, 51.496624718934044],
            [-0.09890821864360078, 51.466784423169656],
          ],
        ],
        type: "Polygon",
      },
      timestamp: new Date("2024-03-20T14:31:00Z"),
      name: "Anti-austerity campaign area",
    },
    {
      id: "qY9R13eRjlVUZQ5GyHIwroX2C2GZuA9g",
      area: 14311817.59,
      geometry: {
        coordinates: [
          [
            [-0.1676382772736531, 51.454985375110425],
            [-0.1028980072736374, 51.423675158113724],
            [-0.09285210330847349, 51.476194541881796],
            [-0.1676382772736531, 51.454985375110425],
          ],
        ],
        type: "Polygon",
      },
      timestamp: new Date(),
      name: "Sallys turf",
    },
  ]);

  const handleEditSearch = (index: number, newText: string) => {
    setSearchHistory((prev) =>
      prev.map((item, i) => (i === index ? { ...item, text: newText } : item))
    );
  };

  const handleDeleteSearch = (index: number) => {
    setSearchHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const loading = areaStatsLoading || dataSourcesLoading || markersLoading;
  return (
    <div className={styles.map}>
      <Controls
        dataSources={dataSourcesData?.dataSources || []}
        mapConfig={mapConfig}
        onChange={(nextConfig) =>
          setMapConfig(new MapConfig({ ...mapConfig, ...nextConfig }))
        }
        areaStatsData={areaStatsData?.areaStats}
        searchHistory={searchHistory}
        onEditSearch={handleEditSearch}
        onDeleteSearch={handleDeleteSearch}
        mapRef={mapRef}
        members={markersData?.markers}
        selectedMember={selectedMarker}
        onSelectMember={(member) => setSelectedMarker(member)}
        turfHistory={TurfHistory}
        setTurfHistory={setTurfHistory}
        loading={loading}
      />
      <Map
        onClickMarker={(markerData) => setSelectedMarker(markerData)}
        onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)}
        onMoveEnd={async (boundingBox, zoom) => {
          setBoundingBox(boundingBox);
          setZoom(zoom);
        }}
        ref={mapRef}
        mapConfig={mapConfig}
        searchHistory={searchHistory}
        setSearchHistory={setSearchHistory}
        TurfHistory={TurfHistory}
        setTurfHistory={setTurfHistory}
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
        <TurfPolygons polygons={TurfHistory} />
      </Map>
      <Legend areaStats={areaStatsData?.areaStats} />

      {loading ? (
        <div className={styles.loading}>
          <div></div>
        </div>
      ) : null}
    </div>
  );
}
