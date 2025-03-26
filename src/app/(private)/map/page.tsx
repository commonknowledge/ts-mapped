"use client";

import { gql, useQuery } from "@apollo/client";
import { scaleLinear, scaleSequential } from "d3-scale";
import { interpolateOrRd } from "d3-scale-chromatic";
import { Map as Mapbox } from "mapbox-gl";
import { useEffect, useState } from "react";
import MapGL, { Layer, Marker, Popup, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./page.module.css";
import {
  AREA_SET_GROUP_LABELS,
  AreaSetGroupCode,
  MAPBOX_SOURCE_IDS,
  getMapSource,
} from "./sources";

interface MarkerData {
  id: number;
  json: Record<string, unknown>;
  point: { lat: number; lng: number };
}

const DEFAULT_ZOOM = 5;

export default function Map() {
  const [markersDataSourceId, setMarkersDataSourceId] = useState<string>("");
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [areaDataSourceId, setAreaDataSourceId] = useState<string>("");
  const [areaSetGroupCode, setAreaSetGroupCode] =
    useState<AreaSetGroupCode>("WMC24");
  const [areaSetColumn, setAreaSetColumn] = useState<string>("");
  const [map, setMap] = useState<Mapbox>();
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const {
    mapboxSourceId,
    mapboxLayerId,
    nameProperty,
    codeProperty,
    areaSetCode,
    minZoom,
  } = getMapSource(areaSetGroupCode, zoom);
  const requiresBoundingBox = minZoom >= 10;

  const { data: dataSourcesData, loading: dataSourcesLoading } = useQuery(
    gql`
      query DataSources {
        dataSources {
          id
          name
          columnDefs {
            name
            type
          }
        }
      }
    `
  );

  const { data: markersData, loading: markersLoading } = useQuery(
    gql`
      query Markers($dataSourceId: String!) {
        markers(dataSourceId: $dataSourceId) {
          id
          json
          point {
            lng
            lat
          }
        }
      }
    `,
    {
      variables: {
        dataSourceId: markersDataSourceId,
      },
      skip: !markersDataSourceId,
    }
  );

  const {
    data: areaStatsData,
    loading: areaStatsLoading,
    fetchMore: areaStatsFetchMore,
  } = useQuery(
    gql`
      query AreaStats(
        $areaSetCode: String!
        $dataSourceId: String!
        $column: String!
        $operation: Operation!
        $excludeColumns: [String!]!
        $boundingBox: BoundingBox
      ) {
        areaStats(
          areaSetCode: $areaSetCode
          dataSourceId: $dataSourceId
          column: $column
          operation: $operation
          excludeColumns: $excludeColumns
          boundingBox: $boundingBox
        ) {
          areaCode
          value
        }
      }
    `,
    {
      variables: {
        areaSetCode: areaSetCode,
        dataSourceId: areaDataSourceId,
        column: areaSetColumn,
        operation: "AVG",
        excludeColumns: ["segment", "f1", "f2"],
        // A dummy boundingBox is required here for fetchMore() to update this query's data
        boundingBox: requiresBoundingBox
          ? { north: 0, east: 0, south: 0, west: 0 }
          : null,
      },
      skip: !areaDataSourceId || !areaSetColumn,
      notifyOnNetworkStatusChange: true,
    }
  );

  useEffect(() => {
    if (!map || !areaStatsData) {
      return;
    }

    if (map.getSource(mapboxSourceId)) {
      map.removeFeatureState({
        source: mapboxSourceId,
        sourceLayer: mapboxLayerId,
      });
    }

    areaStatsData.areaStats.forEach(
      (stat: { areaCode: string; value: string | number }) => {
        map.setFeatureState(
          {
            source: mapboxSourceId,
            sourceLayer: mapboxLayerId,
            id: stat.areaCode,
          },
          stat
        );
      }
    );
  }, [areaStatsData, lastLoadedSourceId, map, mapboxLayerId, mapboxSourceId]);

  const getColorStops = () => {
    const defaultStops = [0, "rgba(0, 0, 0, 0)"];
    if (!areaStatsData) {
      return defaultStops;
    }

    const values = areaStatsData.areaStats.map(
      (stat: { value: string | number }) => stat.value
    );
    let minValue = null;
    let maxValue = null;
    for (const v of values) {
      if (minValue === null || v < minValue) {
        minValue = v;
      }
      if (maxValue === null || v > maxValue) {
        maxValue = v;
      }
    }

    if (minValue === maxValue) {
      return defaultStops;
    }

    const numSteps = 30;
    const stepScale = scaleLinear()
      .domain([0, numSteps - 1])
      .range([minValue, maxValue]);

    const colorScale = scaleSequential()
      .domain([minValue, maxValue])
      .interpolator(interpolateOrRd);

    return new Array(numSteps).fill(null).flatMap((_, i) => {
      const step = stepScale(i);
      return [step, colorScale(step)];
    });
  };

  const loading = areaStatsLoading || dataSourcesLoading || markersLoading;
  const dataSources = dataSourcesData?.dataSources || [];
  const dataSource = dataSources.find(
    (ds: { id: string }) => ds.id === areaDataSourceId
  );
  const markers = markersData?.markers || [];

  return (
    <div className={styles.map}>
      <MapGL
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        initialViewState={{
          longitude: -4.5481, // 54.2361° N, 4.5481° W
          latitude: 54.2361,
          zoom: DEFAULT_ZOOM,
        }}
        style={{ flexGrow: 1 }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        onLoad={(e) => setMap(e.target)}
        onSourceData={(e) => {
          if (e.sourceId && MAPBOX_SOURCE_IDS.includes(e.sourceId)) {
            setLastLoadedSourceId(e.sourceId);
          }
        }}
        onMoveEnd={async (e) => {
          setZoom(e.viewState.zoom);
          const bounds = e.target.getBounds();
          if (bounds && requiresBoundingBox) {
            await areaStatsFetchMore({
              variables: {
                boundingBox: {
                  north: bounds.getNorth(),
                  east: bounds.getEast(),
                  south: bounds.getSouth(),
                  west: bounds.getWest(),
                },
              },
            });
          }
        }}
      >
        {markers.map((marker: MarkerData) => (
          <Marker
            key={marker.id}
            latitude={marker.point.lat}
            longitude={marker.point.lng}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedMarker(marker);
            }}
          />
        ))}
        {selectedMarker ? (
          <Popup
            latitude={selectedMarker.point.lat}
            longitude={selectedMarker.point.lng}
            onClose={() => setSelectedMarker(null)}
          >
            <div>
              {Object.keys(selectedMarker.json).map((key) => (
                <div key={key}>
                  {key}: {String(selectedMarker.json[key])}
                </div>
              ))}
            </div>
          </Popup>
        ) : null}
        <Source
          id={mapboxSourceId}
          key={mapboxSourceId}
          promoteId={codeProperty}
          type="vector"
          url={`mapbox://${mapboxSourceId}`}
        >
          {/* Fill Layer */}
          <Layer
            id={`${mapboxSourceId}-fill`}
            source={mapboxSourceId}
            source-layer={mapboxLayerId}
            type="fill"
            paint={{
              "fill-color": [
                "interpolate",
                ["linear"],
                ["to-number", ["feature-state", "value"], 0],
                ...getColorStops(),
              ],
              "fill-opacity": 0.5,
            }}
          />

          {/* Line Layer */}
          <Layer
            id={`${mapboxSourceId}-line`}
            source={mapboxSourceId}
            source-layer={mapboxLayerId}
            type="line"
            paint={{
              "line-color": "#000",
              "line-width": 2,
            }}
          />

          {/* Symbol Layer (Labels) */}
          <Layer
            id={`${mapboxSourceId}-labels`}
            source={mapboxSourceId}
            source-layer={mapboxLayerId}
            type="symbol"
            layout={{
              "symbol-placement": "point",
              "text-field": ["get", nameProperty],
              "text-size": 14,
              "text-anchor": "center",
            }}
            paint={{
              "text-color": "#ffffff",
              "text-halo-color": "#000000",
              "text-halo-width": 1.5,
            }}
          />
        </Source>
      </MapGL>
      <div className={styles.controls}>
        <select
          value={markersDataSourceId}
          onChange={(e) => setMarkersDataSourceId(e.target.value)}
        >
          <option value="">Select a markers data source</option>
          {dataSources.map((ds: { id: string; name: string }) => (
            <option key={ds.id} value={ds.id}>
              {ds.name}
            </option>
          ))}
        </select>
        <select
          value={areaDataSourceId}
          onChange={(e) => setAreaDataSourceId(e.target.value)}
        >
          <option value="">Select an area data source</option>
          {dataSources.map((ds: { id: string; name: string }) => (
            <option key={ds.id} value={ds.id}>
              {ds.name}
            </option>
          ))}
        </select>
        {dataSource ? (
          <select
            value={areaSetColumn}
            onChange={(e) => setAreaSetColumn(e.target.value)}
          >
            <option value="">Select a data column</option>
            {dataSource.columnDefs
              .filter((cd: { type: string }) => cd.type === "number")
              .map((cd: { name: string }) => (
                <option key={cd.name} value={cd.name}>
                  {cd.name}
                </option>
              ))}
          </select>
        ) : null}
        <select
          value={areaSetGroupCode}
          onChange={(e) =>
            setAreaSetGroupCode(e.target.value as AreaSetGroupCode)
          }
        >
          {Object.keys(AREA_SET_GROUP_LABELS).map((code) => (
            <option key={code} value={code}>
              {AREA_SET_GROUP_LABELS[code as AreaSetGroupCode]}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className={styles.loading}>
          <div></div>
        </div>
      ) : null}
    </div>
  );
}
