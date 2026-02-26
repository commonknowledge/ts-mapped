"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import type { DataSource } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import TogglePanel from "@/app/map/[id]/components/TogglePanel";
import {
  getInspectorColorClass,
  InspectorPanelIcon,
} from "@/app/map/[id]/components/inspector/inspectorPanelOptions";
import PropertiesList, { type PropertyEntry } from "@/app/map/[id]/components/inspector/PropertiesList";
import { getBarColorForLabel } from "@/app/map/[id]/components/inspector/inspectorPanelOptions";
import { getSelectedItemsOrdered } from "@/app/map/[id]/components/inspector/inspectorColumnOrder";
import { cn } from "@/shadcn/utils";

function isDivider(
  item: unknown,
): item is { type: "divider"; id: string; label: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as { type?: string }).type === "divider"
  );
}

/**
 * Reduced inspector preview for the default inspector settings section.
 * Shows a single panel for the given config using the first row from the data source when available.
 */
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
  const sampleRow = listData?.records?.[0]?.json as Record<string, unknown> | undefined;

  const allColumnNames = useMemo(
    () => dataSource.columnDefs.map((c) => c.name),
    [dataSource.columnDefs],
  );

  const entries = useMemo((): PropertyEntry[] => {
    const items = getSelectedItemsOrdered(
      config,
      allColumnNames,
    );
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
        });
        index += 1;
      }
    }
    return result;
  }, [config, allColumnNames, sampleRow]);

  const dataSourceType = getDataSourceType(dataSource);
  const panelIcon = config.icon ? (
    <InspectorPanelIcon iconName={config.icon} className="h-4 w-4 shrink-0" />
  ) : (
    <DataSourceIcon type={dataSourceType} className="shrink-0" />
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
