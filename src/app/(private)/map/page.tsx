"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapRef } from "react-map-gl/mapbox";
import { BoundingBoxInput } from "@/__generated__/types";
import { MapConfig, MapContext } from "@/app/(private)/map/context/MapContext";
import { DEFAULT_ZOOM } from "@/constants";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { DrawnPolygon, MarkerData, SearchResult } from "@/types";
import Controls from "./components/controls/Controls";
import Legend from "./components/Legend";
import Map from "./components/Map";
import MapStyleSelector from "./components/MapStyleSelector";
import {
  useAreaStatsQuery,
  useDataSourcesQuery,
  useMapViewsQuery,
  useMarkersQuery,
} from "./data";
import styles from "./page.module.css";
import { getChoroplethLayerConfig } from "./sources";

export default function MapPage() {
  const { organisationId } = useContext(OrganisationsContext);
  /* Map Ref */
  const mapRef = useRef<MapRef>(null);

  /* Map State */
  const [boundingBox, setBoundingBox] = useState<BoundingBoxInput | null>(null);
  const [editingPolygon, setEditingPolygon] = useState<DrawnPolygon | null>(
    null,
  );
  // Storing the last loaded source triggers re-render when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [mapConfig, setMapConfig] = useState(new MapConfig());
  const [searchHistory, setSearchHistory] =
    useState<SearchResult[]>(SAMPLE_MARKERS);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [turfHistory, setTurfHistory] = useState<DrawnPolygon[]>(SAMPLE_TURF);
  const [viewId, setViewId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  /* Derived State */
  const choroplethLayerConfig = useMemo(() => {
    return getChoroplethLayerConfig(mapConfig.areaSetGroupCode, zoom);
  }, [mapConfig.areaSetGroupCode, zoom]);

  const updateMapConfig = (nextMapConfig: Partial<MapConfig>) => {
    setMapConfig(new MapConfig({ ...mapConfig, ...nextMapConfig }));
  };

  /* GraphQL Data */
  const dataSourcesQuery = useDataSourcesQuery();
  const { data: mapViewsData, loading: mapViewsLoading } =
    useMapViewsQuery(organisationId);

  const markersQuery = useMarkersQuery({
    dataSourceId: mapConfig.markersDataSourceId,
  });

  const areaStatsQuery = useAreaStatsQuery({
    areaSetCode: choroplethLayerConfig.areaSetCode,
    dataSourceId: mapConfig.areaDataSourceId,
    column: mapConfig.areaDataColumn,
    excludeColumns: mapConfig.getExcludeColumns(),
    useDummyBoundingBox: choroplethLayerConfig.requiresBoundingBox,
  });

  const { data: areaStatsData, fetchMore: areaStatsFetchMore } = areaStatsQuery;

  /* Update local map state when saved views are loaded from the server */
  useEffect(() => {
    if (mapViewsData?.mapViews && mapViewsData.mapViews.length > 0) {
      const nextViewId = mapViewsData?.mapViews[0].id;
      const nextConfig = { ...mapViewsData?.mapViews[0].config };
      delete nextConfig.__typename;
      setViewId(nextViewId);
      setMapConfig(new MapConfig(nextConfig));
    }
  }, [mapViewsData]);

  /* Set Mapbox feature state on receiving new AreaStats */
  useEffect(() => {
    if (!areaStatsData) {
      return;
    }

    if (mapRef?.current?.getSource(choroplethLayerConfig.mapbox.sourceId)) {
      mapRef?.current?.removeFeatureState({
        source: choroplethLayerConfig.mapbox.sourceId,
        sourceLayer: choroplethLayerConfig.mapbox.layerId,
      });
    }

    areaStatsData.areaStats?.stats.forEach((stat) => {
      mapRef?.current?.setFeatureState(
        {
          source: choroplethLayerConfig.mapbox.sourceId,
          sourceLayer: choroplethLayerConfig.mapbox.layerId,
          id: stat.areaCode,
        },
        stat,
      );
    });
  }, [areaStatsData, choroplethLayerConfig, lastLoadedSourceId, mapRef]);

  /* Do fetchMore() (if layer needs it) when bounding box or config changes */
  useEffect(() => {
    if (!choroplethLayerConfig.requiresBoundingBox || !areaStatsFetchMore) {
      return;
    }
    areaStatsFetchMore({ variables: { boundingBox } });
  }, [areaStatsFetchMore, boundingBox, choroplethLayerConfig, mapConfig]);

  // Don't display any components while waiting for saved map views
  if (mapViewsLoading) {
    return (
      <div className={styles.map}>
        <div className={styles.loading}>
          <div></div>
        </div>
      </div>
    );
  }

  const loading =
    areaStatsQuery.loading || dataSourcesQuery.loading || markersQuery.loading;

  return (
    <MapContext
      value={{
        mapRef,

        boundingBox,
        setBoundingBox,
        editingPolygon,
        setEditingPolygon,
        mapConfig,
        searchHistory,
        setSearchHistory,
        selectedMarker,
        setSelectedMarker,
        turfHistory,
        setTurfHistory,
        viewId,
        setViewId,
        zoom,
        setZoom,

        areaStatsQuery,
        dataSourcesQuery,
        markersQuery,

        choroplethLayerConfig,
        updateMapConfig,
      }}
    >
      <div className={styles.map}>
        <MapStyleSelector />
        <Controls />
        <Map onSourceLoad={(sourceId) => setLastLoadedSourceId(sourceId)} />
        <Legend areaStats={areaStatsData?.areaStats} />
        {loading && (
          <div className={styles.loading}>
            <div></div>
          </div>
        )}
      </div>
    </MapContext>
  );
}

const SAMPLE_MARKERS: SearchResult[] = [
  {
    text: "Abbey Road Studios",
    coordinates: [-0.177331, 51.532005],
    timestamp: new Date(),
  },
];

const SAMPLE_TURF: DrawnPolygon[] = [
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
];
