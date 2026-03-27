"use client";

import { useQuery } from "@tanstack/react-query";
import ConfiguredDataPanel from "@/app/(private)/map/[id]/components/InspectorPanel/ConfiguredDataPanel";
import { useInspectorDataSourceConfig } from "@/app/(private)/map/[id]/hooks/useInspectorDataSourceConfig";
import { useTRPC } from "@/services/trpc/react";
import { cn } from "@/shadcn/utils";

export function DefaultInspectorPreview({
  dataSourceId,
  className,
}: {
  dataSourceId: string;
  className?: string;
}) {
  const trpc = useTRPC();

  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);

  const { data: listData } = useQuery(
    trpc.dataRecord.list.queryOptions({
      dataSourceId,
      page: 0,
    }),
  );

  const sampleRow = listData?.records?.[0] as
    | { id: string; externalId: string; json: Record<string, unknown> }
    | undefined;

  const selectedCount =
    inspectorConfig?.items.filter((i) => i.type === "column").length ?? 0;

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
            dataSourceId={dataSourceId}
            records={sampleRow ? [sampleRow] : []}
            isLoading={false}
            defaultExpanded={true}
          />
        )}
      </div>
    </div>
  );
}
