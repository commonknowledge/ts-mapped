"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useDataSources, useMarkerDataSources } from "@/hooks/useDataSources";
import {
  MarkerColorMode,
  MarkerIconMode,
  MarkerSizeMode,
} from "@/models/MapView";
import { sortColumnValues } from "@/utils/sortColumnValues";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useLayers } from "../../hooks/useLayers";
import { useMapViews } from "../../hooks/useMapViews";
import { mapColors } from "../../styles";
import { resolveCategoryColor } from "../Markers/markerStyle";
import MarkerShapeIcon from "../MarkerShapeIcon";
import type { ColumnMetadata } from "@/models/DataSource";
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
  const { columnMetadata: colorColumnMetadata } = useDataSourceColumn(
    dataSourceId,
    colorColumn || "",
  );

  if (!dataSource) {
    return null;
  }

  const fallbackColor =
    dataSource.defaultMarkerColor ?? mapColors.dataSource.color;

  const iconValues = sortColumnValues({
    values: Object.keys(iconColumnMetadata?.valueIcons ?? {}),
    columnMetadata: iconColumnMetadata,
  });

  const colorValues = colorColumn
    ? sortColumnValues({
        values: getColorLegendValues({
          dataSourceId,
          column: colorColumn,
          columnMetadata: colorColumnMetadata,
          colorMappings,
        }),
        columnMetadata: colorColumnMetadata,
      })
    : [];

  const hasContent =
    (iconColumn && iconValues.length > 0) ||
    (colorColumn && colorValues.length > 0) ||
    Boolean(sizeColumn);

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
                {iconColumnMetadata?.valueLabels?.[value] || value}
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
                style={{
                  backgroundColor: resolveCategoryColor({
                    dataSourceId,
                    column: colorColumn,
                    value,
                    colorMappings,
                    columnMetadata: colorColumnMetadata,
                    fallbackColor,
                  }),
                }}
              />
              <span className="text-xs truncate">
                {colorColumnMetadata?.valueLabels?.[value] || value}
              </span>
            </div>
          ))}
        </LegendSection>
      )}
      {sizeColumn && (
        <LegendSection label={sizeColumn}>
          <div className="flex items-center gap-2">
            <span className="flex items-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
              <span className="w-3.5 h-3.5 rounded-full bg-neutral-400" />
            </span>
            <span className="text-xs text-muted-foreground">
              {visualisation.sizeSortDesc ? "high to low" : "low to high"}
            </span>
          </div>
        </LegendSection>
      )}
    </div>
  );
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

/**
 * Values worth listing in the colour legend: those with a durable colour
 * plus any with a view-level override for this column.
 */
function getColorLegendValues({
  dataSourceId,
  column,
  columnMetadata,
  colorMappings,
}: {
  dataSourceId: string;
  column: string;
  columnMetadata: ColumnMetadata | undefined;
  colorMappings: Record<string, string> | undefined;
}): string[] {
  const values = new Set<string>(
    Object.keys(columnMetadata?.valueColors ?? {}),
  );
  const prefix = `${dataSourceId}.${column}.`;
  for (const key of Object.keys(colorMappings ?? {})) {
    if (key.startsWith(prefix)) {
      values.add(key.slice(prefix.length));
    }
  }
  return [...values];
}
