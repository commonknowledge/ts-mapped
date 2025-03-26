"use client";

import { gql, useQuery } from "@apollo/client";
import { scaleLinear, scaleSequential } from "d3-scale";
import { interpolateOrRd } from "d3-scale-chromatic";
import { useEffect, useRef, useState } from "react";
import MapGL, { Layer, MapRef, Popup, Source } from "react-map-gl/mapbox";
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
  properties: Record<string, unknown>;
  coordinates: number[];
}

const DEFAULT_ZOOM = 5;

export default function Map() {
  const mapRef = useRef<MapRef>(null);
  const [markersDataSourceId, setMarkersDataSourceId] = useState<string>("");
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [areaDataSourceId, setAreaDataSourceId] = useState<string>("");
  const [areaSetGroupCode, setAreaSetGroupCode] =
    useState<AreaSetGroupCode>("WMC24");
  const [areaSetColumn, setAreaSetColumn] = useState<string>("");
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
          type
          features {
            properties
            geometry {
              type
              coordinates
            }
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
    if (!areaStatsData) {
      return;
    }

    if (mapRef.current?.getSource(mapboxSourceId)) {
      mapRef.current?.removeFeatureState({
        source: mapboxSourceId,
        sourceLayer: mapboxLayerId,
      });
    }

    areaStatsData.areaStats.forEach(
      (stat: { areaCode: string; value: string | number }) => {
        mapRef.current?.setFeatureState(
          {
            source: mapboxSourceId,
            sourceLayer: mapboxLayerId,
            id: stat.areaCode,
          },
          stat
        );
      }
    );
  }, [areaStatsData, lastLoadedSourceId, mapboxLayerId, mapboxSourceId]);

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
  const markers = markersData?.markers || {
    type: "FeatureCollection",
    features: [],
  };

  return (
    <div className={styles.map}>
      <MapGL
        initialViewState={{
          longitude: -4.5481, // 54.2361° N, 4.5481° W
          latitude: 54.2361,
          zoom: DEFAULT_ZOOM,
        }}
        ref={mapRef}
        style={{ flexGrow: 1 }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        onClick={(e) => {
          const map = e.target;
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["markers-pins"],
          });
          if (features.length && features[0].geometry.type === "Point") {
            setSelectedMarker({
              id: 1,
              properties: features[0].properties || {},
              coordinates: features[0].geometry.coordinates,
            });
          } else {
            setSelectedMarker(null);
          }
        }}
        onLoad={() => {
          const map = mapRef.current;
          if (!map) {
            return;
          }
          const imageURL = "/map-pin.png";
          map.loadImage(imageURL, (error, image) => {
            if (error) {
              console.error(`Could not load image ${imageURL}: ${error}`);
            }
            if (image && !map.hasImage("map-pin")) {
              map.addImage("map-pin", image);
            }
          });
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
        onSourceData={(e) => {
          // Trigger a re-render when known Map sources load
          if (e.sourceId && MAPBOX_SOURCE_IDS.includes(e.sourceId)) {
            setLastLoadedSourceId(e.sourceId);
          }
        }}
      >
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

        <Source
          id="markers"
          key="markers"
          type="geojson"
          data={markers}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="markers-circles"
            type="circle"
            source="markers"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "rgba(255, 0, 0, 0.25)",
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "point_count"],
                1,
                50,
                1000,
                100,
              ],
            }}
          />
          <Layer
            id="markers-counts"
            type="symbol"
            source="markers"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
            }}
          />
          <Layer
            id="markers-pins"
            type="symbol"
            source="markers"
            filter={["!", ["has", "point_count"]]}
            layout={{
              "icon-image": "map-pin",
              "icon-anchor": "bottom",
              "icon-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                0.5, // Smaller at low zoom levels
                10,
                1.5, // Full size at higher zoom levels
              ],
            }}
          />
        </Source>
        {selectedMarker ? (
          <Popup
            anchor="top"
            latitude={selectedMarker.coordinates[1]}
            longitude={selectedMarker.coordinates[0]}
            closeOnClick={false}
            onClose={() => setSelectedMarker(null)}
          >
            <div>
              {Object.keys(selectedMarker.properties).map((key) => (
                <div key={key}>
                  {key}: {String(selectedMarker.properties[key])}
                </div>
              ))}
            </div>
          </Popup>
        ) : null}
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
