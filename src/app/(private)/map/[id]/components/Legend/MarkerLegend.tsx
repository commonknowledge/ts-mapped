"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useColumnValues } from "@/hooks/useColumnValues";
import { useDataSources, useMarkerDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import {
  MarkerColorMode,
  MarkerIconMode,
  MarkerSizeMode,
} from "@/models/MapView";
import { sortColumnValues } from "@/utils/sortColumnValues";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useLayers } from "../../hooks/useLayers";
import { useMapViews } from "../../hooks/useMapViews";
import {
  buildCategoryColorMap,
  formatCategoryValue,
  getOrderedSizeFactors,
} from "../Markers/markerStyle";
import MarkerShapeIcon from "../MarkerShapeIcon";
import type { MarkerVisualisation } from "@/models/MapView";

/**
 * Decodes the marker encodings (icon shapes, category colours, sizes) for
 * every visible marker data source whose legend is enabled in the view's
 * marker settings.
 */
export default function MarkerLegend() {
  const { viewConfig } = useMapViews();
  const markerDataSources = useMarkerDataSources() || [];
  const { getDataSourceVisibility } = useLayers();

  const withLegend = markerDataSources.filter(
    (ds) =>
      getDataSourceVisibility(ds.id) &&
      viewConfig.markerVisualisations?.[ds.id]?.legend?.show,
  );

  if (withLegend.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {withLegend.map((ds) => (
        <DataSourceMarkerLegend
          key={ds.id}
          dataSourceId={ds.id}
          visualisation={viewConfig.markerVisualisations?.[ds.id] ?? {}}
          colorMappings={viewConfig.colorMappings}
        />
      ))}
    </div>
  );
}

function DataSourceMarkerLegend({
  dataSourceId,
  visualisation,
  colorMappings,
}: {
  dataSourceId: string;
  visualisation: MarkerVisualisation;
  colorMappings: Record<string, string> | undefined;
}) {
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  const iconColumn =
    visualisation.iconMode === MarkerIconMode.Categories
      ? visualisation.iconColumn
      : undefined;
  const colorColumn =
    visualisation.colorMode === MarkerColorMode.Categories
      ? visualisation.colorColumn
      : undefined;
  const sizeColumn =
    visualisation.sizeMode === MarkerSizeMode.Scaled
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

  // Same canonical value list as the marker colour expression, so legend
  // swatches (including auto-assigned defaults) match the map exactly
  const colorColumnValues = useColumnValues({
    dataSourceId,
    column: colorColumn || "",
    columnType: colorColumnDef?.type ?? ColumnType.Unknown,
    nullIsZero: dataSource?.nullIsZero,
    enabled: Boolean(colorColumn),
  });
  const sizeColumnValues = useColumnValues({
    dataSourceId,
    column: sizeColumn || "",
    columnType: sizeColumnDef?.type ?? ColumnType.Unknown,
    nullIsZero: dataSource?.nullIsZero,
    enabled: Boolean(sizeColumn),
  });

  if (!dataSource) {
    return null;
  }

  const iconValues = sortColumnValues({
    values: Object.keys(iconColumnMetadata?.valueIcons ?? {}),
    columnMetadata: iconColumnMetadata,
  });

  const colorMap = colorColumn
    ? buildCategoryColorMap({
        dataSourceId,
        column: colorColumn,
        values: colorColumnValues ?? [],
        colorMappings,
        columnMetadata: colorColumnMetadata,
      })
    : {};
  const colorValues = Object.keys(colorMap);

  // Same value->factor mapping as the map's size expression, shown largest
  // first and sampled down to a handful of rows when there are many values
  const sizeFactors = sizeColumn
    ? getOrderedSizeFactors({
        values: sizeColumnValues ?? [],
        columnMetadata: sizeColumnMetadata,
        descending: visualisation.sizeSortDesc,
      })
    : [];
  const sizeRows = sampleEvenly([...sizeFactors].reverse(), MAX_SIZE_ROWS);

  const hasContent =
    (iconColumn && iconValues.length > 0) ||
    (colorColumn && colorValues.length > 0) ||
    (sizeColumn && sizeRows.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 border border-neutral-200 rounded p-2 bg-white">
      {iconColumn && iconValues.length > 0 && (
        <LegendSection label={iconColumn}>
          {iconValues.map((value) => (
            <div key={value} className="flex items-center gap-2">
              <MarkerShapeIcon
                shape={iconColumnMetadata?.valueIcons?.[value] ?? ""}
                color="#404040"
              />
              <span className="text-xs truncate">
                {formatCategoryValue(value, iconColumnMetadata?.valueLabels)}
              </span>
            </div>
          ))}
        </LegendSection>
      )}
      {colorColumn && colorValues.length > 0 && (
        <LegendSection label={colorColumn}>
          {colorValues.map((value) => (
            <div key={value} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                style={{ backgroundColor: colorMap[value] }}
              />
              <span className="text-xs truncate">
                {formatCategoryValue(value, colorColumnMetadata?.valueLabels)}
              </span>
            </div>
          ))}
        </LegendSection>
      )}
      {sizeColumn && sizeRows.length > 0 && (
        <LegendSection label={sizeColumn}>
          {sizeRows.map(({ value, factor }) => (
            <div key={value} className="flex items-center gap-2">
              <span className="w-[18px] flex items-center justify-center shrink-0">
                <span
                  className="rounded-full bg-neutral-400"
                  style={{
                    width: `${Math.round(factor * 10)}px`,
                    height: `${Math.round(factor * 10)}px`,
                  }}
                />
              </span>
              <span className="text-xs truncate">
                {formatCategoryValue(value, sizeColumnMetadata?.valueLabels)}
              </span>
            </div>
          ))}
        </LegendSection>
      )}
    </div>
  );
}

const MAX_SIZE_ROWS = 5;

// Every nth item so at most `max` remain, always keeping first and last
function sampleEvenly<T>(items: T[], max: number): T[] {
  if (items.length <= max) {
    return items;
  }
  const sampled: T[] = [];
  for (let i = 0; i < max; i++) {
    sampled.push(items[Math.round((i * (items.length - 1)) / (max - 1))]);
  }
  return sampled;
}

function LegendSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="flex items-center gap-1 text-[11px] font-mono uppercase text-muted-foreground cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDownIcon size={12} />
        ) : (
          <ChevronRightIcon size={12} />
        )}
        <span className="truncate">{label}</span>
      </button>
      {expanded && <div className="flex flex-col gap-1 pl-4">{children}</div>}
    </div>
  );
}
