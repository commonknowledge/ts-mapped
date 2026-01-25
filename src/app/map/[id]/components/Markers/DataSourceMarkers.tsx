import { useContext, useMemo } from "react";
import { Source } from "react-map-gl/mapbox";

import { publicMapColorSchemes } from "@/app/map/[id]/styles";
import { MarkerDisplayMode } from "@/server/models/Map";
import { mapColors } from "../../styles";
import { PublicFiltersContext } from "../../view/[viewIdOrHost]/publish/context/PublicFiltersContext";
import { PublicMapContext } from "../../view/[viewIdOrHost]/publish/context/PublicMapContext";
import { ClustersLayer } from "./ClustersLayer";
import { HeatmapLayer } from "./HeatmapLayer";
import { MARKER_CLIENT_EXCLUDED_KEY } from "./utils";
import type { MarkerFeature } from "@/types";
import type { FeatureCollection } from "geojson";

export function DataSourceMarkers({
  dataSourceMarkers,
  isMembers,
  mapConfig,
}: {
  dataSourceMarkers: { dataSourceId: string; markers: MarkerFeature[] };
  isMembers: boolean;
  mapConfig: {
    markerDisplayModes?: Record<string, MarkerDisplayMode>;
    markerColors?: Record<string, string>;
  };
}) {
  const { filteredRecords, publicFilters } = useContext(
    PublicFiltersContext,
  ) || {
    filteredRecords: [],
    publicFilters: {},
  };
  const { publicMap, colorScheme } = useContext(PublicMapContext) || {
    publicMap: null,
    colorScheme: null,
  };

  const displayMode =
    mapConfig.markerDisplayModes?.[dataSourceMarkers.dataSourceId] ??
    MarkerDisplayMode.Clusters;

  const safeMarkers = useMemo<FeatureCollection>(() => {
    if (Object.keys(publicFilters).length === 0) {
      return {
        type: "FeatureCollection",
        features: dataSourceMarkers.markers,
      };
    }

    const recordIds = (filteredRecords || [])
      .map((r: { id: string | number }) => r.id)
      .filter(Boolean);
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

  const sourceId = `${dataSourceMarkers.dataSourceId}-markers`;
  const publicMapColor =
    publicMap?.id && colorScheme
      ? publicMapColorSchemes[colorScheme]?.primary
      : "";

  const customColor = mapConfig.markerColors?.[dataSourceMarkers.dataSourceId];
  const defaultColor = isMembers
    ? mapColors.member.color
    : mapColors.dataSource.color;

  const color = publicMapColor || customColor || defaultColor;

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
