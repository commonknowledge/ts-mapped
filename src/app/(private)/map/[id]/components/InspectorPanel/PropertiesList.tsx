import { Info, Loader2 } from "lucide-react";
import { Fragment } from "react";
import { ColumnSemanticType } from "@/models/DataSource";
import { ColumnDisplayFormat } from "@/models/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import type { ColumnMetadata } from "@/models/DataSource";

export type { ColumnDisplayFormat as ColumnFormat };

export interface PropertyEntry {
  key: string;
  label: string;
  value?: unknown;
  groupLabel?: string;
  format?: ColumnDisplayFormat;
  scaleMax?: number;
  barColor?: string;
  isDivider?: boolean;
  description?: string;
  comparisonBaseline?: number | null;
  comparisonStat?: string;
  comparisonBaselineLoading?: boolean;
  semanticType?: ColumnSemanticType;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

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

function PropertyValue({
  value,
  format = ColumnDisplayFormat.Text,
  scaleMax = 3,
  barColor,
  comparisonBaseline,
  comparisonStat,
  comparisonBaselineLoading,
  semanticType,
}: {
  value: unknown;
  format?: ColumnDisplayFormat;
  scaleMax?: number;
  barColor?: string;
  comparisonBaseline?: number | null;
  comparisonStat?: string;
  comparisonBaselineLoading?: boolean;
  semanticType?: ColumnSemanticType;
}) {
  const num = parseNumeric(value);
  const fill = barFill(barColor);

  if (format === ColumnDisplayFormat.Number && num !== null) {
    return (
      <span className="font-medium tabular-nums">{formatNumber(num)}</span>
    );
  }

  if (format === ColumnDisplayFormat.NumberWithComparison && num !== null) {
    const baseline =
      comparisonBaseline !== undefined && comparisonBaseline !== null
        ? comparisonBaseline
        : null;
    const pct = baseline !== null ? variancePercent(num, baseline) : null;
    const pctLabel =
      pct !== null
        ? pct >= 0
          ? `+${pct.toFixed(1)}%`
          : `${pct.toFixed(1)}%`
        : null;
    const statAbbrev = comparisonStat
      ? comparisonStat === "Average"
        ? "AVG"
        : comparisonStat === "Median"
          ? "MED"
          : comparisonStat === "Min"
            ? "MIN"
            : comparisonStat === "Max"
              ? "MAX"
              : comparisonStat.toUpperCase().slice(0, 3)
      : "";
    const suffix = statAbbrev ? ` ${statAbbrev}` : "";
    const title =
      comparisonStat && baseline !== null
        ? `vs ${comparisonStat}: ${formatNumber(baseline)}`
        : undefined;

    if (comparisonBaselineLoading) {
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
          : num > 1 // fallback heuristic when no semanticType is set
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
    const max = Math.max(2, Math.min(10, scaleMax));
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

export default function PropertiesList({
  properties,
  columnMetadata,
  entries: entriesProp,
  layout = "single",
  dividerBackgroundClassName,
}: {
  properties?: Record<string, unknown> | null;
  columnMetadata?: ColumnMetadata[];
  entries?: PropertyEntry[] | null;
  layout?: "single" | "twoColumn";
  dividerBackgroundClassName?: string;
}) {
  const entries: PropertyEntry[] = entriesProp
    ? entriesProp.filter(
        (e) =>
          e.isDivider ||
          (e.value !== undefined && e.value !== null && String(e.value) !== ""),
      )
    : properties && Object.keys(properties).length
      ? Object.entries(properties).map(([key, value]) => ({
          key,
          label: key,
          value,
          description: columnMetadata?.find((c) => c.name === key)?.description,
          semanticType: columnMetadata?.find((c) => c.name === key)
            ?.semanticType,
        }))
      : [];

  if (!entries.length) return <></>;

  const isTwoColumn = layout === "twoColumn";

  const renderEntry = (e: PropertyEntry) => (
    <div key={e.key}>
      <dt className="mb-[2px] text-muted-foreground text-xs uppercase font-mono flex items-center gap-1">
        {e.label}
        {e.description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info
                className="h-3.5 w-3.5 shrink-0 cursor-help text-black"
                aria-label="Column description"
                tabIndex={0}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{e.description}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </dt>
      <dd>
        <PropertyValue
          value={e.value}
          format={e.format}
          scaleMax={e.scaleMax}
          barColor={e.barColor}
          comparisonBaseline={e.comparisonBaseline}
          comparisonStat={e.comparisonStat}
          comparisonBaselineLoading={e.comparisonBaselineLoading}
          semanticType={e.semanticType}
        />
      </dd>
    </div>
  );

  const byGroup = entries.reduce<{ group?: string; items: PropertyEntry[] }[]>(
    (acc, e) => {
      const last = acc[acc.length - 1];
      if (e.isDivider) {
        acc.push({ group: e.label, items: [] });
      } else if (e.groupLabel !== undefined) {
        if (last?.group === e.groupLabel) last.items.push(e);
        else acc.push({ group: e.groupLabel, items: [e] });
      } else {
        if (last && last.group === undefined) last.items.push(e);
        else acc.push({ items: [e] });
      }
      return acc;
    },
    [],
  );

  return (
    <dl
      className={cn(
        "flex flex-col gap-3 px-3",
        isTwoColumn &&
          "grid grid-cols-2 gap-x-4 gap-y-3 relative before:content-[''] before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 before:-translate-x-px",
      )}
    >
      {byGroup.map((block, i) => (
        <Fragment key={i}>
          {block.group !== undefined && (
            <div
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
          )}
          {block.items.map(renderEntry)}
        </Fragment>
      ))}
    </dl>
  );
}
