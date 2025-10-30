import { use, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { useStore } from "zustand";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { usePrivateMapStore } from "@/app/map/[id]/stores/usePrivateMapStore";
import {
  MARKER_ID_KEY,
  MARKER_MATCHED_KEY,
  MARKER_NAME_KEY,
} from "@/constants";
import { mapColors } from "../styles";
import { PublicMapStoreContext } from "../view/[viewIdOrHost]/publish/stores/usePublicMapStore";
import type { RouterOutputs } from "@/services/trpc/react";
import type { PublicFiltersFormValue } from "@/types";
import type { PointFeature } from "@/types";
import type { FeatureCollection } from "geojson";

const MARKER_CLIENT_EXCLUDED_KEY = "__clientExcluded";

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbaString(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Markers() {
  const { viewConfig } = useMapViews();
  const { mapConfig } = useMapConfig();
  const markerQueries = useMarkerQueries();
  const getDataSourceVisibility = usePrivateMapStore(
    (s) => s.getDataSourceVisibility,
  );

  const memberMarkers = useMemo(
    () =>
      markerQueries?.data.find(
        (dsm) => dsm.dataSourceId === mapConfig.membersDataSourceId,
      ),
    [markerQueries, mapConfig.membersDataSourceId],
  );

  const otherMarkers = useMemo(
    () =>
      mapConfig.markerDataSourceIds.map((id) =>
        markerQueries?.data.find((dsm) => dsm.dataSourceId === id),
      ),
    [markerQueries, mapConfig.markerDataSourceIds],
  );

  return (
    <>
      {memberMarkers && getDataSourceVisibility(memberMarkers.dataSourceId) && (
        <DataSourceMarkers
          key={memberMarkers.dataSourceId}
          dataSourceMarkers={memberMarkers}
          isMembers
        />
      )}
      {otherMarkers.map((markers) => {
        if (
          !markers ||
          !viewConfig.showLocations ||
          !getDataSourceVisibility(markers.dataSourceId)
        ) {
          return null;
        }
        return (
          <DataSourceMarkers
            key={markers.dataSourceId}
            dataSourceMarkers={markers}
            isMembers={false}
          />
        );
      })}
    </>
  );
}

function DataSourceMarkers({
  dataSourceMarkers,
  isMembers,
}: {
  dataSourceMarkers: { dataSourceId: string; markers: PointFeature[] };
  isMembers: boolean;
}) {
  // Use the same pattern as useMarkerQueries - use() to get store
  const store = use(PublicMapStoreContext);
  const isPublicMap = store !== null;

  // Use useStore to subscribe to changes (only when store exists)
  // This follows React hooks rules since useStore is always called
  const publicFilters = store
    ? useStore(store, (s) => s.publicFilters)
    : ({} as Record<string, PublicFiltersFormValue[]>);
  const records = store
    ? useStore(store, (s) => s.records)
    : ([] as NonNullable<
        RouterOutputs["dataSource"]["byIdWithRecords"]
      >["records"]);

  const safeMarkers = useMemo<FeatureCollection>(() => {
    // If not in public map context or no filters, return markers as-is
    if (!isPublicMap || Object.keys(publicFilters).length === 0) {
      return {
        type: "FeatureCollection",
        features: dataSourceMarkers.markers,
      };
    }

    // Add MARKER_CLIENT_EXCLUDED_KEY if public filters are set and marker is not matched
    const recordIds = records.map((r) => r.id).filter(Boolean);
    return {
      type: "FeatureCollection",
      features: dataSourceMarkers.markers.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          [MARKER_CLIENT_EXCLUDED_KEY]: !recordIds.includes(
            String(f.properties[MARKER_ID_KEY]),
          ),
        },
      })),
    };
  }, [dataSourceMarkers.markers, publicFilters, records, isPublicMap]);

  const NOT_MATCHED_CASE = [
    "any",
    ["!", ["get", MARKER_MATCHED_KEY]],
    ["==", ["get", MARKER_CLIENT_EXCLUDED_KEY], true],
  ];

  const sourceId = `${dataSourceMarkers.dataSourceId}-markers`;
  const colors = isMembers ? mapColors.member : mapColors.dataSource;

  return (
    <Source
      id={sourceId}
      key={sourceId}
      type="geojson"
      data={safeMarkers}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
      clusterProperties={{
        matched_count: ["+", ["case", NOT_MATCHED_CASE, 0, 1]],
      }}
    >
      <Layer
        id={`${sourceId}-heatmap`}
        type="heatmap"
        source={sourceId}
        filter={["has", "point_count"]}
        paint={{
          // Adjust weight based on matched_count and point_count
          "heatmap-weight": [
            "*",
            ["case", ["==", ["get", "matched_count"], 0], 0.5, 1.5],
            [
              "interpolate",
              ["exponential", 0.5],
              ["get", "point_count"],
              1,
              0.5,
              10,
              1,
              100,
              1.5,
              1000,
              2,
              10000,
              2.5,
            ],
          ],
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            15,
            3,
          ],
          // Color ramp for heatmap
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            rgbaString(colors.color, 0),
            0.2,
            rgbaString(colors.color, 0.2),
            0.4,
            rgbaString(colors.color, 0.4),
            0.6,
            rgbaString(colors.color, 0.6),
            0.8,
            rgbaString(colors.color, 0.8),
            1,
            rgbaString(colors.color, 1),
          ],
          // Adjust radius by zoom
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            2,
            50,
            100,
            100,
            1000,
            200,
          ],
          "heatmap-opacity": 0.7,
        }}
      />
      <Layer
        id={`${sourceId}-pins`}
        type="circle"
        source={sourceId}
        filter={[
          "any",
          ["!", ["has", "point_count"]],
          ["==", ["get", "point_count"], 1],
        ]}
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 16, 8],
          "circle-color": colors.color,
          "circle-opacity": ["case", NOT_MATCHED_CASE, 0.5, 1],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        }}
      />
      <Layer
        id={`${sourceId}-labels`}
        type="symbol"
        source="markers"
        filter={[
          "any",
          ["!", ["has", "point_count"]],
          ["==", ["get", "point_count"], 1],
        ]}
        minzoom={10}
        layout={{
          "text-field": ["get", MARKER_NAME_KEY],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-transform": "uppercase",
          "text-offset": [0, -1.25],
        }}
        paint={{
          "text-color": colors.color,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        }}
      />
    </Source>
  );
}
