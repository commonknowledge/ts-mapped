"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  InspectorPanelIcon,
  getBarColorForLabel,
  getInspectorColorClass,
} from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import PropertiesList from "@/app/(private)/map/[id]/components/InspectorPanel/PropertiesList";
import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import { ColumnDisplayFormat, InspectorComparisonStat } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { cn } from "@/shadcn/utils";
import type { PropertyEntry } from "@/app/(private)/map/[id]/components/InspectorPanel/PropertiesList";
import type { DataSource } from "@/models/DataSource";
import type { InspectorColumnItem } from "@/models/shared";

function isDivider(
  item: InspectorColumnItem,
): item is { type: "divider"; id: string; label: string } {
  return item.type === "divider";
}

function toComparisonStatLabel(
  stat: InspectorComparisonStat | undefined,
): string {
  switch (stat) {
    case InspectorComparisonStat.Median:
      return "Median";
    case InspectorComparisonStat.Min:
      return "Min";
    case InspectorComparisonStat.Max:
      return "Max";
    default:
      return "Average";
  }
}

function toComparisonStatKey(
  stat: InspectorComparisonStat | undefined,
): "average" | "median" | "min" | "max" {
  switch (stat) {
    case InspectorComparisonStat.Median:
      return "median";
    case InspectorComparisonStat.Min:
      return "min";
    case InspectorComparisonStat.Max:
      return "max";
    default:
      return "average";
  }
}

export function DefaultInspectorPreview({
  items,
  layout,
  color,
  name,
  icon,
  dataSource,
  className,
}: {
  items: InspectorColumnItem[];
  layout: "single" | "twoColumn" | null;
  color: string | null;
  name: string;
  icon: string;
  dataSource: DataSource;
  className?: string;
}) {
  const trpc = useTRPC();

  const { data: listData } = useQuery(
    trpc.dataRecord.list.queryOptions({
      dataSourceId: dataSource.id,
      page: 0,
    }),
  );
  const sampleRow = listData?.records?.[0]?.json as
    | Record<string, unknown>
    | undefined;

  const comparisonColumns = useMemo(
    () =>
      items
        .filter(
          (i): i is Extract<InspectorColumnItem, { type: "column" }> =>
            i.type === "column" &&
            i.displayFormat === ColumnDisplayFormat.NumberWithComparison,
        )
        .map((i) => ({ col: i.name, stat: i.comparisonStat })),
    [items],
  );

  const baselineQueries = useQueries({
    queries: comparisonColumns.map(({ col, stat }) =>
      trpc.dataRecord.columnStat.queryOptions({
        dataSourceId: dataSource.id,
        columnName: col,
        stat: toComparisonStatKey(stat),
      }),
    ),
  });

  const comparisonBaselines = useMemo((): Record<string, number | null> => {
    const out: Record<string, number | null> = {};
    comparisonColumns.forEach(({ col }, i) => {
      out[col] = baselineQueries[i]?.data ?? null;
    });
    return out;
  }, [comparisonColumns, baselineQueries]);

  const comparisonBaselineLoading = useMemo((): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    comparisonColumns.forEach(({ col }, i) => {
      const q = baselineQueries[i];
      out[col] = q?.isLoading === true || q?.isFetching === true;
    });
    return out;
  }, [comparisonColumns, baselineQueries]);

  const entries = useMemo((): PropertyEntry[] => {
    const result: PropertyEntry[] = [];
    let index = 0;
    for (const item of items) {
      if (isDivider(item)) {
        result.push({
          key: `__divider_${item.id}`,
          label: item.label,
          isDivider: true,
        });
      } else {
        const raw = sampleRow?.[item.name];
        const value =
          sampleRow &&
          item.name in sampleRow &&
          raw !== undefined &&
          raw !== null
            ? raw
            : "—";
        result.push({
          key: `col-${index}-${item.name}`,
          label: item.name,
          value,
          format: item.displayFormat,
          scaleMax: item.scaleMax,
          barColor: getBarColorForLabel(
            item.name,
            item.name,
            index,
            item.barColor,
          ),
          ...(item.displayFormat ===
            ColumnDisplayFormat.NumberWithComparison && {
            comparisonBaseline: comparisonBaselines[item.name] ?? null,
            comparisonStat: toComparisonStatLabel(item.comparisonStat),
            comparisonBaselineLoading:
              comparisonBaselineLoading[item.name] === true,
          }),
        });
        index += 1;
      }
    }
    return result;
  }, [items, sampleRow, comparisonBaselines, comparisonBaselineLoading]);

  const dataSourceType = dataSource.config?.type ?? "unknown";
  const panelIcon = icon ? (
    <InspectorPanelIcon iconName={icon} className="h-4 w-4 shrink-0" />
  ) : (
    <span className="shrink-0">
      <DataSourceIcon type={dataSourceType} />
    </span>
  );

  const selectedCount = items.filter((i) => i.type === "column").length;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm text-sm overflow-hidden",
        className,
      )}
    >
      <div className="shrink-0 px-3 py-2 border-b border-neutral-200">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Preview
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          How this data source will appear in the inspector
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <TogglePanel
          label={name || dataSource.name}
          icon={panelIcon}
          defaultExpanded={true}
          wrapperClassName={getInspectorColorClass(color ?? undefined)}
        >
          {selectedCount === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No columns selected
            </p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Add columns above to see them here
            </p>
          ) : (
            <PropertiesList
              entries={entries}
              layout={layout ?? "single"}
              dividerBackgroundClassName={getInspectorColorClass(
                color ?? undefined,
              )}
            />
          )}
        </TogglePanel>
      </div>
    </div>
  );
}
