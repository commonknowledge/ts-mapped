"use client";

import { CornerDownRight, LandPlot, SquareStack } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { BoundingBoxInput } from "@/__generated__/types";
import { MAX_COLUMN_KEY } from "@/constants";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { DrawnPolygon, MarkerData, SearchResult } from "@/types";
import Choropleth from "./components/Choropleth";
import MarkersControl from "./components/control/MarkersControl";
import MembersControl from "./components/control/MembersControl";
import TurfControl from "./components/control/TurfControl";
import Controls, { MapConfig } from "./components/Controls";
import ControlsTab from "./components/ControlsTab";
import Legend from "./components/Legend";
import Map from "./components/Map";
import { MapStyleSelector } from "./components/MapStyling";
import Markers from "./components/Markers";
import SearchHistoryMarkers from "./components/SearchHistoryMarkers";
import TurfPolygons from "./components/TurfPolygons";
import {
  useAreaStatsQuery,
  useDataSourcesQuery,
  useMarkersQuery,
} from "./data";
import styles from "./page.module.css";
import {
  AREA_SET_GROUP_LABELS,
  AreaSetGroupCode,
  getChoroplethLayerConfig,
} from "./sources";

const DEFAULT_ZOOM = 5;

export default function MapPage() {
  /* Map state */
  const mapRef = useRef<MapRef>(null);
  // Storing the last loaded source triggers re-render when Mapbox layers load
  const [lastLoadedSourceId, setLastLoadedSourceId] = useState<
    string | undefined
  >();
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [boundingBox, setBoundingBox] = useState<BoundingBoxInput | null>(null);
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

  const [turfHistory, setTurfHistory] = useState<DrawnPolygon[]>([
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
      prev.map((item, i) => (i === index ? { ...item, text: newText } : item)),
    );
  };

  const handleDeleteSearch = (index: number) => {
    setSearchHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const [editingPolygon, setEditingPolygon] = useState<DrawnPolygon | null>(
    null,
  );

  const loading = areaStatsLoading || dataSourcesLoading || markersLoading;
  const onChangeConfig = (nextConfig: Partial<MapConfig>) => {
    setMapConfig(new MapConfig({ ...mapConfig, ...nextConfig }));
  };
  const dataSource = (dataSourcesData?.dataSources || []).find(
    (ds) => ds.id === mapConfig.areaDataSourceId,
  );

  return (
    <div className={styles.map}>
      <MapStyleSelector mapConfig={mapConfig} onChange={onChangeConfig} />
      <Controls>
        <ControlsTab label="Layers">
          <MembersControl
            dataSource={markersData?.dataSource}
            mapRef={mapRef}
            isLoading={loading}
            showMembers={mapConfig.showMembers}
            setShowMembers={(value) => onChangeConfig({ showMembers: value })}
            mapConfig={mapConfig}
            onChange={onChangeConfig}
            dataSources={dataSourcesData?.dataSources || []}
          />
          <Separator />
          <MarkersControl
            searchHistory={searchHistory}
            mapRef={mapRef}
            onEdit={handleEditSearch}
            onDelete={handleDeleteSearch}
            isLoading={loading}
            showLocations={mapConfig.showLocations}
            setShowLocations={(value) =>
              onChangeConfig({ showLocations: value })
            }
            setSearchHistory={setSearchHistory}
            onAdd={(marker) => {
              handleEditSearch(0, marker.text);
            }}
          />
          <Separator />
          <TurfControl
            turfHistory={turfHistory}
            mapRef={mapRef}
            setTurfHistory={setTurfHistory}
            isLoading={loading}
            showTurf={mapConfig.showTurf}
            setShowTurf={(value) => onChangeConfig({ showTurf: value })}
            setEditingPolygon={setEditingPolygon}
          />
        </ControlsTab>
        <ControlsTab label="Legend">
          <div className="flex flex-col gap-2">
            <Label htmlFor="areaDataSourceId">
              <LandPlot className="w-4 h-4 text-muted-foreground" />
              Area Data Source
            </Label>
            <Select
              value={mapConfig.areaDataSourceId}
              onValueChange={(value) =>
                onChangeConfig({ areaDataSourceId: value })
              }
            >
              <SelectTrigger className="w-full shadow-none">
                <SelectValue placeholder="Select an area data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Null">None</SelectItem>
                {(dataSourcesData?.dataSources || []).map(
                  (ds: { id: string; name: string }) => (
                    <SelectItem key={ds.id} value={ds.id}>
                      {ds.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            {dataSource ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <CornerDownRight className="ml-2 w-4 h-4 text-muted-foreground" />
                  <Select
                    value={mapConfig.areaDataColumn}
                    onValueChange={(value) =>
                      onChangeConfig({ areaDataColumn: value })
                    }
                  >
                    <SelectTrigger className="w-full shadow-none">
                      <SelectValue placeholder="Select a data column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MAX_COLUMN_KEY}>
                        Highest-value column
                      </SelectItem>
                      {dataSource.columnDefs.map((cd: { name: string }) => (
                        <SelectItem key={cd.name} value={cd.name}>
                          {cd.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
          </div>
          {mapConfig.areaDataColumn === MAX_COLUMN_KEY ? (
            <input
              type="text"
              onChange={(e) =>
                onChangeConfig({
                  excludeColumnsString: e.target.value,
                })
              }
              placeholder="Comma-separated columns to exclude"
              value={mapConfig.excludeColumnsString}
            />
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="areaSetGroupCode">
              <SquareStack className="w-4 h-4 text-muted-foreground" />
              Boundary Set
            </Label>
            <Select
              value={mapConfig.areaSetGroupCode}
              onValueChange={(value) =>
                onChangeConfig({ areaSetGroupCode: value as AreaSetGroupCode })
              }
            >
              <SelectTrigger className="w-full shadow-none">
                <SelectValue placeholder="Select a boundary set" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(AREA_SET_GROUP_LABELS).map((code) => (
                  <SelectItem key={code} value={code}>
                    {AREA_SET_GROUP_LABELS[code as AreaSetGroupCode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        setTurfHistory={setTurfHistory}
      >
        <Choropleth
          areaStats={areaStatsData?.areaStats}
          choroplethLayerConfig={choroplethLayerConfig}
          mapConfig={mapConfig}
        />
        <Markers
          dataSource={markersData?.dataSource}
          selectedMarker={selectedMarker}
          onCloseSelectedMarker={() => setSelectedMarker(null)}
          mapConfig={mapConfig}
        />
        <SearchHistoryMarkers
          searchHistory={searchHistory}
          mapConfig={mapConfig}
        />
        <TurfPolygons
          polygons={turfHistory}
          mapConfig={mapConfig}
          editingPolygon={editingPolygon}
          setEditingPolygon={setEditingPolygon}
        />
      </Map>
      <Legend areaStats={areaStatsData?.areaStats} />

      {loading && (
        <div className={styles.loading}>
          <div></div>
        </div>
      )}
    </div>
  );
}
