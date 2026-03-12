"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { JobStatus } from "@/server/models/DataSource";
import { type RouterOutputs, useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";

export function DataSourceEnrichmentDashboard({
  dataSource,
}: {
  dataSource: RouterOutputs["dataSource"]["byId"];
}) {
  const [enriching, setEnriching] = useState(isEnriching(dataSource));
  const [lastEnriched, setLastEnriched] = useState(
    dataSource.enrichmentInfo?.lastCompleted || null,
  );
  const [enrichmentCount, setEnrichmentCount] = useState(0);

  const trpc = useTRPC();
  const { mutate: enqueueEnrichDataSourceJob } = useMutation(
    trpc.dataSource.enqueueEnrichJob.mutationOptions({
      onError: (error) => {
        console.error(`Could not schedule enrichment job: ${error}`);
        const errorMessage =
          error.message || "Could not schedule enrichment job.";
        setEnriching(false);
        toast.error(errorMessage);
      },
    }),
  );

  const { data, isLoading } = useQuery(
    trpc.dataRecord.list.queryOptions({
      dataSourceId: dataSource.id,
      page: 0,
    }),
  );

  useSubscription(
    trpc.dataSource.events.subscriptionOptions(
      { dataSourceId: dataSource.id },
      {
        onData: (dataSourceEvent) => {
          if (dataSourceEvent.event === "EnrichmentStarted") {
            setEnriching(true);
          }
          if (dataSourceEvent.event === "RecordsEnriched") {
            setEnrichmentCount(dataSourceEvent.count);
          }
          if (dataSourceEvent.event === "EnrichmentFailed") {
            setEnriching(false);
            toast.error("Failed to enrich this data source.");
          }
          if (dataSourceEvent.event === "EnrichmentComplete") {
            setEnriching(false);
            setLastEnriched(dataSourceEvent.at);
          }
        },
      },
    ),
  );

  const onClickEnrichRecords = () => {
    setEnriching(true);
    setEnrichmentCount(0);
    enqueueEnrichDataSourceJob({ dataSourceId: dataSource.id });
  };

  const displayEnrichmentProgress = enrichmentCount > 0 || enriching;

  const columns = dataSource.columnDefs ?? [];
  const records = data?.records.slice(0, 10) ?? [];

  return (
    <div className="p-4 mx-auto w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {displayEnrichmentProgress && (
            <p>Enrichment count: {enrichmentCount}</p>
          )}
          {lastEnriched && (
            <p>Last enriched: {new Date(lastEnriched).toLocaleString()}</p>
          )}
        </div>
        <Button
          type="button"
          onClick={onClickEnrichRecords}
          disabled={enriching}
        >
          <RefreshCw className={enriching ? "animate-spin" : ""} />
          {enriching ? "Enriching…" : "Enrich records"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading records…</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-left font-medium text-gray-600 whitespace-nowrap"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="even:bg-gray-50/50">
                {columns.map((col) => (
                  <td
                    key={col.name}
                    className="border border-gray-200 px-3 py-1.5 whitespace-nowrap max-w-[300px] truncate"
                  >
                    {formatCell(record.json[col.name])}
                  </td>
                ))}
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border border-gray-200 px-3 py-4 text-center text-muted-foreground"
                >
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const isEnriching = (dataSource: RouterOutputs["dataSource"]["byId"]) => {
  return Boolean(
    dataSource?.enrichmentInfo?.status &&
    [JobStatus.Running, JobStatus.Pending].includes(
      dataSource.enrichmentInfo?.status,
    ),
  );
};

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
