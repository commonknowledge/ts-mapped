import { useMemo } from "react";
import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useColumnValues } from "@/hooks/useColumnValues";
import { ColumnType } from "@/models/DataSource";
import { MarkerColorMode, MarkerIconMode } from "@/models/MapView";
import { LayerType } from "@/types";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useMapViews } from "../../hooks/useMapViews";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import { mapColors } from "../../styles";
import {
  buildCategoryColorMap,
  getDistinctFeatureValues,
} from "../Markers/markerStyle";
import MarkerShapeIcon from "../MarkerShapeIcon";
import MarkerButton from "./MarkerButton";
import type { DataSource } from "@/models/DataSource";
import type { Folder } from "@/models/Folder";
import type { PlacedMarker } from "@/models/PlacedMarker";
import type { MarkerFeature } from "@/types";
import type { ReactNode } from "react";

export const MembersList = ({
  markers,
  dataSource,
  areaType,
}: {
  markers: MarkerFeature[];
  dataSource: DataSource | undefined | null;
  areaType: "area" | "boundary" | "cluster";
}) => {
  const { setSelectedRecords } = useInspectorState();

  const total = markers.length;

  const onRecordClick = (marker: MarkerFeature) => {
    setSelectedRecords([
      {
        id: marker.properties.id,
        dataSourceId: marker.properties.dataSourceId,
        geocodePoint: {
          lng: marker.geometry.coordinates[0],
          lat: marker.geometry.coordinates[1],
        },
        name: marker.properties.name,
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-mono uppercase text-muted-foreground">
        Members in this {areaType} {total > 0 && <>({total})</>}
      </h2>

      {!dataSource ? (
        <p>No members data source found.</p>
      ) : markers.length > 0 ? (
        <ul>
          {markers.map((marker) => {
            return (
              <li key={marker.properties.id}>
                <MarkerButton
                  label={marker.properties.name}
                  type={LayerType.Member}
                  onClick={() => onRecordClick(marker)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No members in this {areaType}.</p>
      )}
    </div>
  );
};

export const MarkersList = ({
  markers,
  dataSource,
  children,
}: {
  markers: MarkerFeature[];
  dataSource: DataSource | undefined | null;
  /** Rendered between the heading and the marker list (e.g. a summary chart) */
  children?: ReactNode;
}) => {
  const { setSelectedRecords } = useInspectorState();
  const { getMarkerVisualisation } = useMarkerSettings();

  const total = markers.length;

  // Marker features arrive in unspecified (DB) order; list alphabetically.
  // Sort a copy — the array is shared query-cache data.
  const sortedMarkers = useMemo(
    () =>
      [...markers].sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name),
      ),
    [markers],
  );

  // When the layer styles markers as icons, rows show each marker's assigned
  // shape in place of the bullet. Values ride on the features (properties
  // pipeline); assignments are the resolved columnMetadata.valueIcons.
  const dataSourceId = dataSource?.id ?? "";
  const visualisation = getMarkerVisualisation(dataSourceId);
  const iconColumn =
    visualisation.iconMode === MarkerIconMode.Categories
      ? visualisation.iconColumn
      : undefined;
  const { columnMetadata: iconColumnMetadata } = useDataSourceColumn(
    dataSourceId,
    iconColumn || "",
  );

  const getMarkerShape = (marker: MarkerFeature): string | undefined => {
    if (!iconColumn) {
      return undefined;
    }
    const properties: Record<string, unknown> = marker.properties;
    const raw = properties[iconColumn];
    if (raw === null || raw === undefined) {
      return undefined;
    }
    return iconColumnMetadata?.valueIcons?.[String(raw)];
  };

  // Shape icons take the marker's map colour: the category colour when
  // colour-by-category is on, else the layer colour — same resolution as
  // DataSourceMarkers (canonical values so defaults match the map/legend)
  const { viewConfig } = useMapViews();
  const colorColumn =
    visualisation.colorMode === MarkerColorMode.Categories
      ? visualisation.colorColumn
      : undefined;
  const { columnMetadata: colorColumnMetadata, columnDef: colorColumnDef } =
    useDataSourceColumn(dataSourceId, colorColumn || "");
  const colorColumnValues = useColumnValues({
    dataSourceId,
    column: colorColumn || "",
    columnType: colorColumnDef?.type ?? ColumnType.Unknown,
    nullIsZero: dataSource?.nullIsZero,
    enabled: Boolean(colorColumn),
  });

  const fallbackColor =
    viewConfig.markerColors?.[dataSourceId] ??
    dataSource?.defaultMarkerColor ??
    mapColors.dataSource.color;

  const colorMap = useMemo(
    () =>
      colorColumn
        ? buildCategoryColorMap({
            dataSourceId,
            column: colorColumn,
            values:
              colorColumnValues ??
              getDistinctFeatureValues(markers, colorColumn),
            colorMappings: viewConfig.colorMappings,
            columnMetadata: colorColumnMetadata,
          })
        : {},
    [
      colorColumn,
      colorColumnMetadata,
      colorColumnValues,
      dataSourceId,
      markers,
      viewConfig.colorMappings,
    ],
  );

  const getMarkerColor = (marker: MarkerFeature): string => {
    if (colorColumn) {
      const properties: Record<string, unknown> = marker.properties;
      const raw = properties[colorColumn];
      if (raw !== null && raw !== undefined) {
        const color = colorMap[String(raw)];
        if (color) {
          return color;
        }
      }
    }
    return fallbackColor;
  };

  const onRecordClick = (marker: MarkerFeature) => {
    setSelectedRecords([
      {
        id: marker.properties.id,
        dataSourceId: marker.properties.dataSourceId,
        geocodePoint: {
          lng: marker.geometry.coordinates[0],
          lat: marker.geometry.coordinates[1],
        },
        name: marker.properties.name,
      },
    ]);
  };

  if (markers.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-semibold">
        <div className="shrink-0">
          <DataSourceIcon type={dataSource?.config.type}></DataSourceIcon>
        </div>
        {dataSource?.name} {total > 0 && <>({total})</>}
      </h3>

      {children}

      <ul>
        {sortedMarkers.map((marker) => {
          const shape = getMarkerShape(marker);
          return (
            <li key={marker.properties.id}>
              <MarkerButton
                label={marker.properties.name}
                type={LayerType.Marker}
                icon={
                  shape ? (
                    <MarkerShapeIcon
                      shape={shape}
                      color={getMarkerColor(marker)}
                      size={10}
                    />
                  ) : undefined
                }
                onClick={() => onRecordClick(marker)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const PlacedMarkersList = ({
  folder,
  placedMarkers,
}: {
  folder: Folder | null;
  placedMarkers: PlacedMarker[];
}) => {
  const { setSelectedRecords } = useInspectorState();
  const total = placedMarkers.length;
  const name = folder?.name || "No folder";

  const onRecordClick = (marker: PlacedMarker) => {
    setSelectedRecords([
      {
        id: marker.id,
        geocodePoint: marker.point,
        name: marker.label,
      },
    ]);
  };

  if (placedMarkers.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">
        {name} ({total})
      </h3>

      <ul>
        {placedMarkers.map((marker) => {
          return (
            <li key={marker.id}>
              <MarkerButton
                label={marker.label}
                type={LayerType.Marker}
                onClick={() => onRecordClick(marker)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
