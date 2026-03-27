import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { ColumnType } from "@/models/DataSource";
import { ColumnDisplayFormat, InspectorComparisonStat } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { cn } from "@/shadcn/utils";
import { formatNumber } from "@/utils/text";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useInspectorColumn } from "../../hooks/useInspectorColumn";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { getDisplayValue, parseColumnNumber } from "../../utils/stats";
import {
  getBarColorForLabel,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import { PropertyLabel } from "./PropertyLabel";
import { SimpleRecordProperties } from "./SimpleRecordProperties";
import { buildInspectorBlocks } from "./utils";
import type { ColumnMetadata } from "@/models/DataSource";
import type { InspectorColumn, InspectorItem } from "@/models/shared";

// ============================================================================
// Internal rendering helpers
// ============================================================================

function barFill(barColor?: string): string {
  return barColor?.trim() ? barColor : "var(--primary)";
}

function variancePercent(value: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return ((value - baseline) / baseline) * 100;
}

interface SubRendererProps {
  value: unknown;
  inspectorColumn: InspectorColumn;
  dataSourceId: string;
  columnMetadata?: ColumnMetadata | undefined;
  columnType?: ColumnType | null;
}

function TextOrNumberValue({
  value,
  columnMetadata,
  columnType,
}: Pick<SubRendererProps, "value" | "columnMetadata" | "columnType">) {
  const text = getDisplayValue(value, {
    calculationType: null,
    columnType: columnType ?? ColumnType.Number,
    columnMetadata,
  });
  return <span className="font-medium tabular-nums">{text}</span>;
}

function NumberWithComparisonValue({
  value,
  inspectorColumn,
  dataSourceId,
  columnMetadata,
}: Omit<SubRendererProps, "columnType">) {
  const num = parseColumnNumber(value, {
    calculationType: null,
    columnMetadata,
  });
  const comparisonStat =
    inspectorColumn.comparisonStat || InspectorComparisonStat.Average;

  const trpc = useTRPC();
  const baselineQuery = useQuery(
    trpc.dataRecord.columnStat.queryOptions(
      {
        dataSourceId,
        columnName: inspectorColumn.name,
        stat: comparisonStat,
      },
      { enabled: Boolean(dataSourceId) },
    ),
  );

  if (num === null) {
    return <span className="font-medium">-</span>;
  }

  const baseline = baselineQuery.data ?? null;
  const pct = baseline !== null ? variancePercent(num, baseline) : null;
  const pctLabel =
    pct !== null
      ? pct >= 0
        ? `+${pct.toFixed(1)}%`
        : `${pct.toFixed(1)}%`
      : null;
  const statAbbrev = String(comparisonStat).substring(0, 3);
  const suffix = statAbbrev ? ` ${statAbbrev}` : "";
  const title =
    comparisonStat && baseline !== null
      ? `vs ${comparisonStat}: ${formatNumber(baseline)}`
      : undefined;

  if (baselineQuery.isLoading) {
    return (
      <span
        className="font-medium tabular-nums inline-flex items-baseline gap-1.5 flex-wrap"
        title={title}
      >
        <span>{formatNumber(num)}</span>
        <span className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
          <span>{suffix ? suffix.trim() : "…"}</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className="font-medium tabular-nums inline-flex items-baseline gap-1.5 flex-wrap"
      title={title}
    >
      <span>{formatNumber(num)}</span>
      <span
        className={cn(
          "text-xs font-medium text-muted-foreground",
          pct !== null && pct > 0 && "text-green-700",
          pct !== null && pct < 0 && "text-red-700",
        )}
      >
        {pctLabel !== null ? `${pctLabel}${suffix}` : `—${suffix}`}
      </span>
    </span>
  );
}

function PercentageBarValue({
  value,
  inspectorColumn,
  columnMetadata,
}: Omit<SubRendererProps, "dataSourceId" | "columnType">) {
  const num = parseColumnNumber(value, {
    calculationType: null,
    columnMetadata,
  });
  const fill = barFill(
    getBarColorForLabel(
      inspectorColumn.name,
      columnMetadata?.displayName,
      inspectorColumn.barColor,
    ),
  );

  if (num === null) {
    return <span className="font-medium">-</span>;
  }

  const pct = Math.min(100, Math.max(0, num));
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="h-2 flex-1 min-w-0 rounded-full bg-neutral-200 overflow-hidden"
        title={`${pct.toFixed(0)}%`}
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums shrink-0 w-8 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function ScaleValue({
  value,
  inspectorColumn,
  columnMetadata,
}: Omit<SubRendererProps, "dataSourceId" | "columnType">) {
  const num = parseColumnNumber(value, {
    calculationType: null,
    columnMetadata,
  });
  const fill = barFill(
    getBarColorForLabel(
      inspectorColumn.name,
      columnMetadata?.displayName,
      inspectorColumn.barColor,
    ),
  );

  if (num === null) {
    return <span className="font-medium">-</span>;
  }

  const max = Math.max(2, Math.min(10, inspectorColumn.scaleMax || 2));
  const filled = Math.min(max, Math.max(0, Math.round(num)));
  return (
    <div className="flex items-center gap-1" title={`${filled} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 flex-1 min-w-[6px] rounded-sm transition-colors",
            i < filled ? "" : "bg-neutral-200",
          )}
          style={i < filled ? { backgroundColor: fill } : undefined}
        />
      ))}
    </div>
  );
}

function ConfiguredPropertyValue({
  value,
  name,
  dataSourceId,
}: {
  value: unknown;
  name: string;
  dataSourceId: string;
}) {
  const { columnMetadata, columnDef } = useDataSourceColumn(dataSourceId, name);
  const inspectorColumn = useInspectorColumn(dataSourceId, name);

  const format = inspectorColumn?.displayFormat;

  if (
    !inspectorColumn ||
    format === ColumnDisplayFormat.Number ||
    format === ColumnDisplayFormat.Text ||
    !format
  ) {
    return (
      <TextOrNumberValue
        value={value}
        columnMetadata={columnMetadata}
        columnType={columnDef?.type}
      />
    );
  }

  if (format === ColumnDisplayFormat.NumberWithComparison) {
    return (
      <NumberWithComparisonValue
        value={value}
        inspectorColumn={inspectorColumn}
        dataSourceId={dataSourceId}
        columnMetadata={columnMetadata}
      />
    );
  }

  if (format === ColumnDisplayFormat.Percentage) {
    return (
      <PercentageBarValue
        value={value}
        inspectorColumn={inspectorColumn}
        columnMetadata={columnMetadata}
      />
    );
  }

  if (format === ColumnDisplayFormat.Scale) {
    return (
      <ScaleValue
        value={value}
        inspectorColumn={inspectorColumn}
        columnMetadata={columnMetadata}
      />
    );
  }

  return (
    <TextOrNumberValue
      value={value}
      columnMetadata={columnMetadata}
      columnType={columnDef?.type}
    />
  );
}

// ============================================================================
// ConfiguredRecordProperties
// Renders a single record's json using inspector config items directly.
// Falls back to SimpleRecordProperties when no column items are configured.
// ============================================================================

export function ConfiguredRecordProperties({
  json,
  dataSourceId,
}: {
  json: Record<string, unknown>;
  dataSourceId: string;
}) {
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);

  const inspectorColumns = useMemo(
    () =>
      inspectorConfig?.items?.filter(
        (i): i is Extract<InspectorItem, { type: "column" }> =>
          i.type === "column",
      ) || [],
    [inspectorConfig],
  );

  const hasValues = inspectorColumns.some((item) => {
    const raw = json[item.name];
    return raw !== undefined && raw !== null && String(raw) !== "";
  });

  const blocks = useMemo(
    () => buildInspectorBlocks(inspectorConfig?.items),
    [inspectorConfig?.items],
  );

  if (inspectorColumns.length === 0) {
    return <SimpleRecordProperties json={json} dataSourceId={dataSourceId} />;
  }

  if (!hasValues) {
    return <></>;
  }

  const isTwoColumn = inspectorConfig?.layout === "twoColumn";

  let globalColumnIndex = 0;

  const dividerBackgroundClassName = getInspectorColorClass(
    inspectorConfig?.color,
  );

  return (
    <dl
      className={cn(
        "flex flex-col gap-3 px-3",
        isTwoColumn &&
          "grid grid-cols-2 gap-x-4 gap-y-3 relative before:content-[''] before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 before:-translate-x-px",
      )}
    >
      {blocks.map((block, blockIndex) => {
        const divider =
          block.group !== undefined ? (
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

        const columns = block.columns.map((column) => {
          const index = globalColumnIndex++;
          return (
            <div key={`${column.name}-${index}`}>
              <PropertyLabel
                column={column.name}
                dataSourceId={dataSourceId}
                showSettings={false}
              />
              <dd>
                <ConfiguredPropertyValue
                  value={json[column.name]}
                  name={column.name}
                  dataSourceId={dataSourceId}
                />
              </dd>
            </div>
          );
        });

        return [divider, ...columns];
      })}
    </dl>
  );
}
