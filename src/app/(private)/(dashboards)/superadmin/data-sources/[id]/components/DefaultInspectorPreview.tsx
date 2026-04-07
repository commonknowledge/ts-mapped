"use client";

import { useQuery } from "@tanstack/react-query";
import DataRecordsPanel from "@/app/(private)/map/[id]/components/InspectorPanel/DataRecordsPanel";
import { useInspectorDataSourceConfig } from "@/app/(private)/map/[id]/hooks/useInspectorDataSourceConfig";
import { useDataSources } from "@/hooks/useDataSources";
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
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);

  const selectedCount =
    inspectorConfig?.items.filter((i) => i.type === "column").length ?? 0;

  const { data: listData } = useQuery(
    trpc.dataRecord.list.queryOptions(
      { dataSourceId, page: 0 },
      { enabled: selectedCount > 0 },
    ),
  );

  const sampleRow = listData?.records?.[0];

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
          <DataRecordsPanel
            dataSourceId={dataSourceId}
            records={sampleRow ? [sampleRow] : []}
            isLoading={false}
            defaultExpanded={true}
          />
        )}
      </div>
      <div className="shrink-0 px-3 py-2 border-t border-neutral-200">
        <p className="text-xs text-muted-foreground">
          Organisation: {dataSource?.organisationName ?? "—"}
        </p>
      </div>
    </div>
  );
}
