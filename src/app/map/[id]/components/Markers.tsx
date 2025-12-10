import { useContext, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";

import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMarkerAndTurf } from "@/app/map/[id]/hooks/useMarkerAndTurf";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useMarkerQueries } from "@/app/map/[id]/hooks/useMarkerQueries";
import { publicMapColorSchemes } from "@/app/map/[id]/styles";
import { mapColors } from "../styles";
import { PublicFiltersContext } from "../view/[viewIdOrHost]/publish/context/PublicFiltersContext";
import { PublicMapContext } from "../view/[viewIdOrHost]/publish/context/PublicMapContext";
import type { MarkerFeature } from "@/types";
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
  const { getDataSourceVisibility } = useMarkerAndTurf();

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
  dataSourceMarkers: { dataSourceId: string; markers: MarkerFeature[] };
  isMembers: boolean;
}) {
  const { filteredRecords, publicFilters } = useContext(PublicFiltersContext);
  const { publicMap, colorScheme } = useContext(PublicMapContext);

  const safeMarkers = useMemo<FeatureCollection>(() => {
    // Don't add MARKER_CLIENT_EXCLUDED_KEY property if no public filters exist
    if (Object.keys(publicFilters).length === 0) {
      return {
        type: "FeatureCollection",
        features: dataSourceMarkers.markers,
      };
    }

    // Add MARKER_CLIENT_EXCLUDED_KEY if public filters are set and marker is not matched
    const recordIds = (filteredRecords || []).map((r) => r.id).filter(Boolean);
    return {
      type: "FeatureCollection",
      features: dataSourceMarkers.markers.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          [MARKER_CLIENT_EXCLUDED_KEY]: !recordIds.includes(f.properties.id),
        },
      })),
    };
  }, [dataSourceMarkers.markers, filteredRecords, publicFilters]);

  const NOT_MATCHED_CASE = [
    "any",
    ["!", ["get", "matched"]],
    ["==", ["get", MARKER_CLIENT_EXCLUDED_KEY], true],
  ];

  const sourceId = `${dataSourceMarkers.dataSourceId}-markers`;
  const publicMapColor =
    publicMap?.id && colorScheme
      ? publicMapColorSchemes[colorScheme]?.primary
      : "";
  const color = publicMapColor
    ? publicMapColor
    : isMembers
      ? mapColors.member.color
      : mapColors.dataSource.color;

  return (
    <Source
      id={sourceId}
      key={sourceId}
      type="geojson"
      data={safeMarkers}
      cluster={true}
      clusterMaxZoom={publicMap ? 22 : 11}
      clusterRadius={50}
      clusterProperties={{
        matched_count: ["+", ["case", NOT_MATCHED_CASE, 0, 1]],
        ids: [
          "concat",
          [
            "concat",
            ["get", "id"],
            ":",
            ["get", "dataSourceId"],
            ":",
            ["get", "name"],
            ",",
          ],
        ],
      }}
    >
      {publicMap ? (
        [
          <Layer
            id={`${sourceId}-circles`}
            key={`${sourceId}-circles`}
            type="circle"
            source={sourceId}
            filter={["has", "point_count"]}
            paint={{
              // Circle radius based on point_count
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "point_count"],
                1,
                15,
                10,
                25,
                100,
                35,
                1000,
                50,
                10000,
                70,
              ],
              // Circle color
              "circle-color": color,
              // Opacity based on matched_count
              "circle-opacity": [
                "case",
                ["==", ["get", "matched_count"], 0],
                0.5,
                0.8,
              ],
            }}
          />,

          <Layer
            id={`${sourceId}-counts`}
            key={`${sourceId}-counts`}
            type="symbol"
            source={sourceId}
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count"],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            }}
          />,
        ]
      ) : (
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
              rgbaString(color, 0),
              0.2,
              rgbaString(color, 0.2),
              0.4,
              rgbaString(color, 0.4),
              0.6,
              rgbaString(color, 0.6),
              0.8,
              rgbaString(color, 0.8),
              1,
              rgbaString(color, 1),
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
      )}
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
          "circle-color": color,
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
          "text-field": [
            "concat",
            ["slice", ["get", "name"], 0, 20],
            ["case", [">", ["length", ["get", "name"]], 20], "...", ""],
          ],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-transform": "uppercase",
          "text-offset": [0, -1.25],
        }}
        paint={{
          "text-color": color,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        }}
      />
    </Source>
  );
}
