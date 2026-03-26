import { useQuery } from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { ColumnSemanticType } from "@/models/DataSource";
import { ColumnDisplayFormat, InspectorComparisonStat } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import { resolveColumnMetadataEntry } from "@/utils/resolveColumnMetadata";
import { formatNumber } from "@/utils/text";
import {
  getBarColorForLabel,
  getInspectorColorClass,
} from "./inspectorPanelOptions";
import { SimpleRecordProperties } from "./SimpleRecordProperties";
import type { SimpleDataSource } from "./SimpleRecordProperties";
import type { InspectorDataSourceConfig } from "@/models/MapView";
import type { InspectorColumn, InspectorItem } from "@/models/shared";

// ============================================================================
// Internal rendering helpers
// ============================================================================

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function barFill(barColor?: string): string {
  return barColor?.trim() ? barColor : "var(--primary)";
}

function variancePercent(value: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return ((value - baseline) / baseline) * 100;
}

function ConfiguredPropertyValue({
  value: raw,
  inspectorColumn,
  dataSourceId,
  semanticType,
}: {
  value: unknown;
  inspectorColumn: InspectorColumn;
  dataSourceId: string;
  semanticType?: ColumnSemanticType | undefined;
}) {
  const format = inspectorColumn.displayFormat;
  const value =
    raw !== undefined && raw !== null && String(raw) !== "" ? raw : "—";
  const num = parseNumeric(raw);

  const barColor = getBarColorForLabel(
    inspectorColumn.name,
    inspectorColumn.name,
    inspectorColumn.barColor,
  );

  const fill = barFill(barColor);

  const comparisonStat =
    inspectorColumn.comparisonStat || InspectorComparisonStat.Average;

  const trpc = useTRPC();

  const baselineQuery = useQuery(
    trpc.dataRecord.columnStat.queryOptions(
      {
        dataSourceId: dataSourceId,
        columnName: inspectorColumn.name,
        stat: comparisonStat,
      },
      { enabled: Boolean(dataSourceId) },
    ),
  );

  if (
    inspectorColumn.displayFormat === ColumnDisplayFormat.Number &&
    num !== null
  ) {
    return (
      <span className="font-medium tabular-nums">{formatNumber(num)}</span>
    );
  }

  if (
    inspectorColumn.displayFormat ===
      ColumnDisplayFormat.NumberWithComparison &&
    num !== null
  ) {
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

  if (format === ColumnDisplayFormat.Percentage && num !== null) {
    const pct =
      semanticType === ColumnSemanticType.Percentage01
        ? Math.min(100, Math.max(0, num * 100))
        : semanticType === ColumnSemanticType.Percentage0100
          ? Math.min(100, Math.max(0, num))
          : num > 1
            ? Math.min(100, Math.max(0, num))
            : Math.min(100, Math.max(0, num * 100));
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

  if (format === ColumnDisplayFormat.Scale && num !== null) {
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

  return <span className="font-medium">{String(value ?? "")}</span>;
}

// ============================================================================
// ConfiguredRecordProperties
// Renders a single record's json using inspector config items directly.
// Falls back to SimpleRecordProperties when no column items are configured.
// ============================================================================

export function ConfiguredRecordProperties({
  json,
  dataSource,
  inspectorConfig,
}: {
  json: Record<string, unknown>;
  dataSource?: SimpleDataSource | null;
  inspectorConfig: InspectorDataSourceConfig;
}) {
  const inspectorColumns = useMemo(
    () =>
      inspectorConfig.inspectorItems?.filter(
        (i): i is Extract<InspectorItem, { type: "column" }> =>
          i.type === "column",
      ) || [],
    [inspectorConfig],
  );

  const hasValues = inspectorColumns.some((item) => {
    const raw = json[item.name];
    return raw !== undefined && raw !== null && String(raw) !== "";
  });

  if (inspectorColumns.length === 0) {
    return <SimpleRecordProperties json={json} dataSource={dataSource} />;
  }

  if (!hasValues) {
    return <></>;
  }

  const isTwoColumn = inspectorConfig.layout === "twoColumn";

  // Build blocks separated by dividers
  const blocks: {
    group?: string;
    columns: Extract<InspectorItem, { type: "column" }>[];
  }[] = [];
  for (const item of inspectorConfig.inspectorItems || []) {
    if (item.type === "divider") {
      blocks.push({ group: item.label, columns: [] });
    } else {
      const last = blocks[blocks.length - 1];
      if (last) {
        last.columns.push(item);
      } else {
        blocks.push({ columns: [item] });
      }
    }
  }

  let globalColumnIndex = 0;

  const dividerBackgroundClassName = getInspectorColorClass(
    inspectorConfig.color,
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

          const metadata = resolveColumnMetadataEntry(
            dataSource?.columnMetadata || [],
            dataSource?.organisationOverride?.columnMetadata,
            column.name,
          );

          return (
            <div key={`col-${index}-${column.name}`}>
              <dt className="mb-[2px] text-muted-foreground text-xs uppercase font-mono flex items-center gap-1">
                {column.name}
                {metadata?.description ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className="h-3.5 w-3.5 shrink-0 cursor-help text-black"
                        aria-label="Column description"
                        tabIndex={0}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{metadata.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </dt>
              <dd>
                <ConfiguredPropertyValue
                  value={json[column.name]}
                  inspectorColumn={column}
                  dataSourceId={inspectorConfig.dataSourceId}
                  semanticType={metadata?.semanticType}
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
