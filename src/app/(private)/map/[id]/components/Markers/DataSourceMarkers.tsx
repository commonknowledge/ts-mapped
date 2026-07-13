import { useMemo } from "react";
import { Source } from "react-map-gl/mapbox";

import { publicMapColorSchemes } from "@/app/(private)/map/[id]/styles";
import { useColumnValues } from "@/hooks/useColumnValues";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
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
  buildCategoryColorMap,
  buildColorExpression,
  buildIconImageExpression,
  buildSizeFactorExpression,
  buildSortKeyExpression,
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
  const { columnMetadata: colorColumnMetadata, columnDef: colorColumnDef } =
    useDataSourceColumn(dataSourceId, colorColumn || "");
  const { columnMetadata: sizeColumnMetadata, columnDef: sizeColumnDef } =
    useDataSourceColumn(dataSourceId, sizeColumn || "");

  // Canonical distinct values (all records, server-side) so default colour
  // assignment matches the legend; loaded features are the fallback.
  const { getDataSourceById } = useDataSources();
  const nullIsZero = getDataSourceById(dataSourceId)?.nullIsZero;
  const colorColumnValues = useColumnValues({
    dataSourceId,
    column: colorColumn || "",
    columnType: colorColumnDef?.type ?? ColumnType.Unknown,
    nullIsZero,
    enabled: Boolean(colorColumn),
  });
  const sizeColumnValues = useColumnValues({
    dataSourceId,
    column: sizeColumn || "",
    columnType: sizeColumnDef?.type ?? ColumnType.Unknown,
    nullIsZero,
    enabled: Boolean(sizeColumn),
  });

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
            colorMap: buildCategoryColorMap({
              dataSourceId,
              column: colorColumn,
              values:
                colorColumnValues ??
                getDistinctFeatureValues(features, colorColumn),
              colorMappings,
              columnMetadata: colorColumnMetadata,
            }),
            column: colorColumn,
            fallbackColor: color,
          })
        : color,
      sizeFactor: sizeColumn
        ? buildSizeFactorExpression({
            column: sizeColumn,
            values:
              sizeColumnValues ??
              getDistinctFeatureValues(features, sizeColumn),
            columnMetadata: sizeColumnMetadata,
            descending: visualisation.sizeSortDesc,
          })
        : 1,
      // When markers overlap, colour categories earlier in the value order
      // (top of the colour list) draw on top of later ones
      sortKey: colorColumn
        ? buildSortKeyExpression({
            column: colorColumn,
            values:
              colorColumnValues ??
              getDistinctFeatureValues(features, colorColumn),
            columnMetadata: colorColumnMetadata,
          })
        : 0,
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
    colorColumnValues,
    sizeColumnValues,
    colorMappings,
    color,
  ]);

  // Icon markers are meant to be read individually, so icon mode fully
  // disables clustering for the layer
  const clustered =
    displayMode === MarkerDisplayMode.Clusters && !pinStyle?.useIcons;

  return (
    <Source
      id={sourceId}
      // Keyed by cluster state: GeoJSON source cluster options cannot be
      // changed in place, so toggling clustering must re-create the source
      key={`${sourceId}-${clustered ? "clustered" : "unclustered"}`}
      type="geojson"
      data={safeMarkers}
      cluster={clustered}
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
