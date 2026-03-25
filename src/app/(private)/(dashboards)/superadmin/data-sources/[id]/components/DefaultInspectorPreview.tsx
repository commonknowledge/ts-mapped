"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getSelectedItemsOrdered } from "@/app/(private)/map/[id]/components/inspector/inspectorColumnOrder";
import {
  InspectorPanelIcon,
  getBarColorForLabel,
  getInspectorColorClass,
} from "@/app/(private)/map/[id]/components/inspector/inspectorPanelOptions";
import PropertiesList from "@/app/(private)/map/[id]/components/inspector/PropertiesList";
import type { PropertyEntry } from "@/app/(private)/map/[id]/components/inspector/PropertiesList";
import TogglePanel from "@/app/(private)/map/[id]/components/TogglePanel";
import DataSourceIcon from "@/components/DataSourceIcon";
import { useTRPC } from "@/services/trpc/react";
import { cn } from "@/shadcn/utils";
import type { DataSource } from "@/models/DataSource";
import type { InspectorBoundaryConfig } from "@/models/MapView";

function isDivider(
  item: unknown,
): item is { type: "divider"; id: string; label: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as { type?: string }).type === "divider"
  );
}

const COMPARISON_STAT_LABEL: Record<string, string> = {
  average: "Average",
  median: "Median",
  min: "Min",
  max: "Max",
};

export function DefaultInspectorPreview({
  config,
  dataSource,
  className,
}: {
  config: InspectorBoundaryConfig;
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

  const allColumnNames = useMemo(
    () => dataSource.columnDefs.map((c) => c.name),
    [dataSource.columnDefs],
  );

  const comparisonColumns = useMemo(
    () =>
      (config.columns ?? [])
        .filter(
          (col) =>
            config.columnMetadata?.[col]?.format === "numberWithComparison",
        )
        .map((col) => ({
          col,
          stat: config.columnMetadata?.[col]?.comparisonStat ?? "average",
        })),
    [config.columns, config.columnMetadata],
  );

  const baselineQueries = useQueries({
    queries: comparisonColumns.map(({ col, stat }) =>
      trpc.dataRecord.columnStat.queryOptions({
        dataSourceId: dataSource.id,
        columnName: col,
        stat: stat as "average" | "median" | "min" | "max",
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
    const items = getSelectedItemsOrdered(config, allColumnNames);
    const meta = config.columnMetadata ?? {};
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
        const m = meta[item];
        const raw = sampleRow?.[item];
        const value =
          sampleRow && item in sampleRow && raw !== undefined && raw !== null
            ? raw
            : "—";
        result.push({
          key: `col-${index}-${String(item)}`,
          label: m?.displayName ?? item,
          value,
          format: m?.format,
          scaleMax: m?.scaleMax,
          barColor: getBarColorForLabel(
            m?.displayName ?? item,
            item,
            index,
            m?.barColor,
          ),
          description: m?.description,
          ...(m?.format === "numberWithComparison" && {
            comparisonBaseline: comparisonBaselines[item] ?? null,
            comparisonStat:
              COMPARISON_STAT_LABEL[m.comparisonStat ?? "average"] ??
              m.comparisonStat ??
              "Average",
            comparisonBaselineLoading: comparisonBaselineLoading[item] === true,
          }),
        });
        index += 1;
      }
    }
    return result;
  }, [
    config,
    allColumnNames,
    sampleRow,
    comparisonBaselines,
    comparisonBaselineLoading,
  ]);

  const dataSourceType = dataSource.config?.type ?? "unknown";
  const panelIcon = config.icon ? (
    <InspectorPanelIcon iconName={config.icon} className="h-4 w-4 shrink-0" />
  ) : (
    <span className="shrink-0">
      <DataSourceIcon type={dataSourceType} />
    </span>
  );

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
          label={config.name || dataSource.name}
          icon={panelIcon}
          defaultExpanded={true}
          wrapperClassName={getInspectorColorClass(config.color)}
        >
          {config.columns?.length === 0 ? (
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
              layout={config.layout ?? "single"}
              dividerBackgroundClassName={getInspectorColorClass(config.color)}
            />
          )}
        </TogglePanel>
      </div>
    </div>
  );
}
