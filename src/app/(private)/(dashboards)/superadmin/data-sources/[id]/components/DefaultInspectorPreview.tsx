"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ConfiguredDataPanel from "@/app/(private)/map/[id]/components/InspectorPanel/ConfiguredDataPanel";
import { useTRPC } from "@/services/trpc/react";
import { cn } from "@/shadcn/utils";
import type { DataSource } from "@/models/DataSource";
import type { InspectorItem } from "@/models/shared";

export function DefaultInspectorPreview({
  items,
  layout,
  color,
  name,
  icon,
  dataSource,
  className,
}: {
  items: InspectorItem[];
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

  const sampleRow = listData?.records?.[0] as
    | { id: string; externalId: string; json: Record<string, unknown> }
    | undefined;

  const selectedCount = items.filter((i) => i.type === "column").length;

  // Construct a synthetic InspectorDataSourceConfig from the preview props.
  // resolveInspectorConfig will return it as-is since items are already populated.
  const syntheticConfig = useMemo(
    () => ({
      id: "preview",
      dataSourceId: dataSource.id,
      name: name || dataSource.name,
      inspectorItems: items,
      layout,
      icon,
      color,
    }),
    [dataSource.id, dataSource.name, name, items, layout, icon, color],
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
        {selectedCount === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No columns selected
          </p>
        ) : (
          <ConfiguredDataPanel
            config={syntheticConfig}
            records={sampleRow ? [sampleRow] : []}
            isLoading={false}
            defaultExpanded={true}
          />
        )}
      </div>
    </div>
  );
}
