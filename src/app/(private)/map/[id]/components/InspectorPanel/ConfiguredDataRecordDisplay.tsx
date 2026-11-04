import React, { useMemo } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import {
  MarkerColorMode,
  MarkerIconMode,
  MarkerSizeMode,
} from "@/models/MapView";
import { ColumnDisplayFormat } from "@/models/shared";
import { cn } from "@/shadcn/utils";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import DataRecordColumns from "./DataRecordColumns";
import InspectorBarChart from "./InspectorBarChart";
import InspectorLineChart from "./InspectorLineChart";
import { getInspectorColorClass } from "./inspectorPanelOptions";
import { useInspectorVariant } from "./InspectorVariantContext";
import { buildInspectorBlocks } from "./utils";
import type { InspectorItem } from "@/models/shared";

// ============================================================================
// ConfiguredDataRecordDisplay
// Renders a single record's json using inspector config items directly.
// Falls back to DataRecordColumns when no column items are configured.
// ============================================================================

const CHARTABLE_FORMATS: ColumnDisplayFormat[] = [
  ColumnDisplayFormat.Number,
  ColumnDisplayFormat.Percentage,
  ColumnDisplayFormat.Scale,
  ColumnDisplayFormat.NumberWithComparison,
];

export default function ConfiguredDataRecordDisplay({
  json,
  dataSourceId,
  excludeColumns,
}: {
  json: Record<string, unknown>;
  dataSourceId: string;
  /** Columns already shown elsewhere, e.g. as key figures */
  excludeColumns?: string[];
}) {
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);
  const isLight = useInspectorVariant().variant === "light";
  const items = useMemo(
    () =>
      inspectorConfig?.items?.filter(
        (i) => i.type !== "column" || !excludeColumns?.includes(i.name),
      ),
    [excludeColumns, inspectorConfig?.items],
  );
  const { getMarkerVisualisation } = useMarkerSettings();

  const inspectorColumns = useMemo(
    () =>
      items?.filter(
        (i): i is Extract<InspectorItem, { type: "column" }> =>
          i.type === "column",
      ) || [],
    [items],
  );

  // Columns driving the marker visualisation always show — the record
  // display decodes the selected marker's encodings, overriding the
  // inspector config's column selection
  const visualisation = getMarkerVisualisation(dataSourceId);
  const missingEncodingColumns = useMemo(() => {
    const encodingColumns = [
      visualisation.iconMode === MarkerIconMode.Categories
        ? visualisation.iconColumn
        : undefined,
      visualisation.colorMode === MarkerColorMode.Categories
        ? visualisation.colorColumn
        : undefined,
      visualisation.sizeMode === MarkerSizeMode.Scaled
        ? visualisation.sizeColumn
        : undefined,
    ].filter((c): c is string => Boolean(c));
    return [...new Set(encodingColumns)].filter(
      (c) =>
        !inspectorColumns.some((i) => i.name === c) &&
        !excludeColumns?.includes(c),
    );
  }, [visualisation, inspectorColumns, excludeColumns]);

  const hasValues = [
    ...inspectorColumns.map((item) => item.name),
    ...missingEncodingColumns,
  ].some((name) => {
    const raw = json[name];
    return raw !== undefined && raw !== null && String(raw) !== "";
  });

  const blocks = useMemo(() => buildInspectorBlocks(items), [items]);

  if (inspectorColumns.length === 0) {
    // Nothing configured (or everything shown elsewhere): every other column
    const columns = Object.keys(json).filter(
      (c) => !excludeColumns?.includes(c),
    );
    if (excludeColumns?.length && inspectorConfig?.items?.length) {
      return <></>;
    }
    return (
      <DataRecordColumns
        columns={columns}
        json={json}
        dataSourceId={dataSourceId}
      />
    );
  }

  if (!hasValues) {
    return <></>;
  }

  const isTwoColumn = inspectorConfig?.layout === "twoColumn";

  // A chart takes the group's number columns; anything else under it (a
  // text column, say) still shows, as rows after the chart
  const isChartable = (column: string) => {
    const format = inspectorColumns.find(
      (c) => c.name === column,
    )?.displayFormat;
    if (format) return CHARTABLE_FORMATS.includes(format);
    return (
      dataSource?.columnDefs.find((c) => c.name === column)?.type ===
      ColumnType.Number
    );
  };

  const dividerBackgroundClassName = getInspectorColorClass(
    inspectorConfig?.color,
  );

  return (
    <dl
      className={cn(
        "flex flex-col gap-3",
        isTwoColumn &&
          (isLight
            ? // No centre rule: it ran into dividers and full-width charts
              "grid grid-cols-2 gap-x-4 gap-y-3"
            : "grid grid-cols-2 gap-x-4 gap-y-3 relative before:content-[''] before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 before:-translate-x-px"),
      )}
    >
      {blocks.map((block, blockIndex) => {
        const divider =
          block.group !== undefined && isLight ? (
            // A rule and a label set like the column labels (mono caps)
            <div
              key={`divider-${blockIndex}`}
              className={cn(
                "border-t border-neutral-200 pt-3 font-mono text-xs text-muted-foreground uppercase first:border-t-0 first:pt-0",
                isTwoColumn ? "col-span-2 mt-1 first:mt-0" : "mt-1 first:mt-0",
              )}
            >
              {block.group}
            </div>
          ) : block.group !== undefined ? (
            <div
              key={`divider-${blockIndex}`}
              className={cn(
                "text-neutral-500 text-xs font-medium uppercase tracking-wide pt-4 relative z-10",
                dividerBackgroundClassName ?? "bg-inherit",
                isTwoColumn
                  ? "col-span-2 mt-2 first:mt-0 first:border-t-0 first:pt-0"
                  : "mt-3 first:mt-0 first:border-t-0 first:pt-0",
              )}
            >
              <div className="border-t border-neutral-400 pt-2">
                {block.group}
              </div>
            </div>
          ) : null;

        return (
          <React.Fragment key={`properties-${blockIndex}`}>
            {divider}
            {block.display === "barChart" || block.display === "lineChart" ? (
              <>
                <div className={cn("min-w-0", isTwoColumn && "col-span-2")}>
                  {block.display === "lineChart" ? (
                    <InspectorLineChart
                      columns={block.columns.filter(isChartable)}
                      json={json}
                      dataSourceId={dataSourceId}
                    />
                  ) : (
                    <InspectorBarChart
                      columns={block.columns.filter(isChartable)}
                      json={json}
                      dataSourceId={dataSourceId}
                    />
                  )}
                </div>
                <DataRecordColumns
                  columns={block.columns.filter((c) => !isChartable(c))}
                  json={json}
                  dataSourceId={dataSourceId}
                />
              </>
            ) : (
              <DataRecordColumns
                columns={block.columns}
                json={json}
                dataSourceId={dataSourceId}
              />
            )}
          </React.Fragment>
        );
      })}
      {missingEncodingColumns.length > 0 && (
        <DataRecordColumns
          columns={missingEncodingColumns}
          json={json}
          dataSourceId={dataSourceId}
        />
      )}
    </dl>
  );
}
