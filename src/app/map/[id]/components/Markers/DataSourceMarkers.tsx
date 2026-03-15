import { useMemo } from "react";
import { Source } from "react-map-gl/mapbox";

import { publicMapColorSchemes } from "@/app/map/[id]/styles";
import { MarkerDisplayMode } from "@/server/models/Map";
import { useMapMode } from "../../hooks/useMapCore";
import {
  useFilteredRecords,
  usePublicFilters,
} from "../../publish/hooks/usePublicFilters";
import {
  useColorScheme,
  usePublicMapValue,
} from "../../publish/hooks/usePublicMap";
import { mapColors } from "../../styles";
import { ClustersLayer } from "./ClustersLayer";
import { HeatmapLayer } from "./HeatmapLayer";
import { MARKER_CLIENT_EXCLUDED_KEY } from "./utils";
import type { MarkerFeature } from "@/types";
import type { FeatureCollection } from "geojson";

export function DataSourceMarkers({
  dataSourceMarkers,
  isMembers,
  mapConfig,
  hideFilteredMarkers = false,
}: {
  dataSourceMarkers: { dataSourceId: string; markers: MarkerFeature[] };
  isMembers: boolean;
  mapConfig: {
    markerDisplayModes?: Record<string, MarkerDisplayMode>;
    markerColors?: Record<string, string>;
  };
  hideFilteredMarkers?: boolean;
}) {
  const filteredRecords = useFilteredRecords();
  const publicFilters = usePublicFilters();
  const publicMap = usePublicMapValue();
  const colorScheme = useColorScheme();
  const mapMode = useMapMode();

  const displayMode =
    mapConfig.markerDisplayModes?.[dataSourceMarkers.dataSourceId] ??
    MarkerDisplayMode.Clusters;

  const safeMarkers = useMemo<FeatureCollection>(() => {
    const hasClientFilters = Object.keys(publicFilters).length > 0;

    let features = dataSourceMarkers.markers;

    // When hideFilteredMarkers is true, remove server-side unmatched markers
    if (hideFilteredMarkers) {
      features = features.filter((f) => f.properties.matched !== false);
    }

    if (!hasClientFilters) {
      return {
        type: "FeatureCollection",
        features,
      };
    }

    const recordIds = (filteredRecords || [])
      .map((r: { id: string | number }) => r.id)
      .filter(Boolean);

    const mappedFeatures = features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        [MARKER_CLIENT_EXCLUDED_KEY]: !recordIds.includes(f.properties.id),
      },
    }));

    return {
      type: "FeatureCollection",
      features: mappedFeatures,
    };
  }, [
    dataSourceMarkers.markers,
    filteredRecords,
    publicFilters,
    hideFilteredMarkers,
  ]);

  const sourceId = `${dataSourceMarkers.dataSourceId}-markers`;
  const publicMapColor =
    publicMap?.id && colorScheme
      ? publicMapColorSchemes[colorScheme]?.primary
      : "";

  const customColor = mapConfig.markerColors?.[dataSourceMarkers.dataSourceId];
  const defaultColor = isMembers
    ? mapColors.member.color
    : mapColors.dataSource.color;

  const color =
    mapMode === "public"
      ? publicMapColor || defaultColor
      : customColor || defaultColor;

  const NOT_MATCHED_CASE = [
    "any",
    ["!", ["get", "matched"]],
    ["==", ["get", MARKER_CLIENT_EXCLUDED_KEY], true],
  ];

  return (
    <Source
      id={sourceId}
      key={sourceId}
      type="geojson"
      data={safeMarkers}
      cluster={displayMode === MarkerDisplayMode.Clusters}
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
      {displayMode === MarkerDisplayMode.Clusters && (
        <ClustersLayer sourceId={sourceId} color={color} />
      )}
      {displayMode === MarkerDisplayMode.Heatmap && (
        <HeatmapLayer sourceId={sourceId} color={color} />
      )}
    </Source>
  );
}
