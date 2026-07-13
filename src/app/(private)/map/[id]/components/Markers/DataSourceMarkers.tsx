import { useMemo } from "react";
import { Source } from "react-map-gl/mapbox";

import { publicMapColorSchemes } from "@/app/(private)/map/[id]/styles";
import { MarkerDisplayMode } from "@/models/Map";
import {
  MarkerColorMode,
  MarkerIconMode,
  MarkerSizeMode,
} from "@/models/MapView";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useMapMode } from "../../hooks/useMapCore";
import {
  useFilteredRecords,
  usePublicDateFilter,
  usePublicFilters,
} from "../../publish/hooks/usePublicFilters";
import {
  useColorScheme,
  usePublicMapValue,
} from "../../publish/hooks/usePublicMap";
import { mapColors } from "../../styles";
import { ClustersLayer } from "./ClustersLayer";
import { HeatmapLayer } from "./HeatmapLayer";
import {
  buildColorExpression,
  buildIconImageExpression,
  buildSizeFactorExpression,
  getDistinctFeatureValues,
} from "./markerStyle";
import { MARKER_CLIENT_EXCLUDED_KEY } from "./utils";
import type { MarkerPinStyle } from "./ClustersLayer";
import type { MarkerVisualisation } from "@/models/MapView";
import type { MarkerFeature } from "@/types";
import type { FeatureCollection } from "geojson";

const NOT_MATCHED_CASE = [
  "any",
  ["!", ["get", "matched"]],
  ["==", ["get", MARKER_CLIENT_EXCLUDED_KEY], true],
];

export function DataSourceMarkers({
  dataSourceMarkers,
  isMembers,
  mapConfig,
  markerColors,
  defaultMarkerColor,
  markerVisualisation,
  colorMappings,
  hideFilteredMarkers = false,
}: {
  dataSourceMarkers: { dataSourceId: string; markers: MarkerFeature[] };
  isMembers: boolean;
  mapConfig: {
    markerDisplayModes?: Record<string, MarkerDisplayMode>;
  };
  markerColors?: Record<string, string>;
  defaultMarkerColor?: string | null;
  markerVisualisation?: MarkerVisualisation;
  colorMappings?: Record<string, string>;
  hideFilteredMarkers?: boolean;
}) {
  const filteredRecords = useFilteredRecords();
  const publicFilters = usePublicFilters();
  const publicDateFilter = usePublicDateFilter();
  const publicMap = usePublicMapValue();
  const colorScheme = useColorScheme();
  const mapMode = useMapMode();

  const dataSourceId = dataSourceMarkers.dataSourceId;

  const displayMode =
    mapConfig.markerDisplayModes?.[dataSourceId] ?? MarkerDisplayMode.Clusters;

  const safeMarkers = useMemo<FeatureCollection>(() => {
    const hasClientFilters =
      Object.keys(publicFilters).length > 0 ||
      Object.values(publicDateFilter).some(Boolean);

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
    publicDateFilter,
    hideFilteredMarkers,
  ]);

  const sourceId = `${dataSourceId}-markers`;
  const publicMapColor =
    publicMap?.id && colorScheme
      ? publicMapColorSchemes[colorScheme]?.primary
      : "";

  // View override, then the data source's default colour
  const customColor = markerColors?.[dataSourceId] ?? defaultMarkerColor;
  const defaultColor = isMembers
    ? mapColors.member.color
    : mapColors.dataSource.color;

  const color =
    mapMode === "public"
      ? publicMapColor || defaultColor
      : customColor || defaultColor;

  // Column-driven styling (private editor only)
  const visualisation = mapMode === "public" ? undefined : markerVisualisation;
  const iconColumn =
    visualisation?.iconMode === MarkerIconMode.Categories
      ? visualisation.iconColumn
      : undefined;
  const colorColumn =
    visualisation?.colorMode === MarkerColorMode.Categories
      ? visualisation.colorColumn
      : undefined;
  const sizeColumn =
    visualisation?.sizeMode === MarkerSizeMode.Scaled
      ? visualisation.sizeColumn
      : undefined;

  const { columnMetadata: iconColumnMetadata } = useDataSourceColumn(
    dataSourceId,
    iconColumn || "",
  );
  const { columnMetadata: colorColumnMetadata } = useDataSourceColumn(
    dataSourceId,
    colorColumn || "",
  );
  const { columnMetadata: sizeColumnMetadata } = useDataSourceColumn(
    dataSourceId,
    sizeColumn || "",
  );

  const pinStyle = useMemo<MarkerPinStyle | undefined>(() => {
    if (!visualisation) {
      return undefined;
    }
    const features = dataSourceMarkers.markers;
    return {
      useIcons: Boolean(iconColumn),
      iconImage: iconColumn
        ? buildIconImageExpression({
            column: iconColumn,
            values: getDistinctFeatureValues(features, iconColumn),
            columnMetadata: iconColumnMetadata,
          })
        : undefined,
      color: colorColumn
        ? buildColorExpression({
            dataSourceId,
            column: colorColumn,
            values: getDistinctFeatureValues(features, colorColumn),
            colorMappings,
            columnMetadata: colorColumnMetadata,
            fallbackColor: color,
          })
        : color,
      sizeFactor: sizeColumn
        ? buildSizeFactorExpression({
            column: sizeColumn,
            values: getDistinctFeatureValues(features, sizeColumn),
            columnMetadata: sizeColumnMetadata,
            descending: visualisation.sizeSortDesc,
          })
        : 1,
      opacity: (visualisation.opacityPct ?? 100) / 100,
      showLabels: visualisation.showLabels !== false,
    };
  }, [
    visualisation,
    dataSourceMarkers.markers,
    dataSourceId,
    iconColumn,
    colorColumn,
    sizeColumn,
    iconColumnMetadata,
    colorColumnMetadata,
    sizeColumnMetadata,
    colorMappings,
    color,
  ]);

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
        // Concatenate each feature's pre-serialised JSON string with a trailing
        // comma so the cluster accumulates a ","-joined list that can be wrapped
        // in "[]" and parsed as a JSON array on click. Using JSON encoding avoids
        // breakage when field values (e.g. name) contain commas or colons.
        asJson: ["concat", ["concat", ["get", "asJson"], ","]],
      }}
    >
      {displayMode === MarkerDisplayMode.Clusters && (
        <ClustersLayer sourceId={sourceId} color={color} pinStyle={pinStyle} />
      )}
      {displayMode === MarkerDisplayMode.Heatmap && (
        <HeatmapLayer sourceId={sourceId} color={color} />
      )}
    </Source>
  );
}
