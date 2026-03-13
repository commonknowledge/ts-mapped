"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataSourceFeatures } from "@/features";
import {
  ColumnType,
  type Enrichment,
  JobStatus,
} from "@/server/models/DataSource";
import { type RouterOutputs, useTRPC } from "@/services/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";
import { Button } from "@/shadcn/ui/button";
import AddColumnDialog from "./AddColumnDialog";

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

  const [deleteEnrichment, setDeleteEnrichment] = useState<{
    index: number;
    enrichment: Enrichment;
  } | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

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

  const { mutate: updateConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Column removed successfully");
        setDeleteEnrichment(null);
        queryClient.invalidateQueries({
          queryKey: trpc.dataSource.byId.queryKey({
            dataSourceId: dataSource.id,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.dataRecord.list.queryKey({
            dataSourceId: dataSource.id,
            page: 0,
          }),
        });
      },
      onError: (error) => {
        toast.error("Failed to remove column", {
          description: error.message,
        });
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

  const existingColumns = dataSource.columnDefs ?? [];
  const existingColumnNames = new Set(existingColumns.map((col) => col.name));
  const enrichments = dataSource.enrichments ?? [];

  // Map enrichment column names to their enrichment info so we can
  // decorate columns that already exist in columnDefs after import.
  const enrichmentByColumnName = new Map(
    enrichments.map((e, i) => [
      `Mapped: ${e.name}`,
      { enrichmentIndex: i, enrichment: e },
    ]),
  );

  const decoratedExisting = existingColumns.map((col) => {
    const info = enrichmentByColumnName.get(col.name);
    return info ? { ...col, ...info } : col;
  });

  const newEnrichmentColumns = enrichments
    .map((e, i) => ({
      name: `Mapped: ${e.name}`,
      type: ColumnType.String,
      enrichmentIndex: i,
      enrichment: e,
    }))
    .filter((col) => !existingColumnNames.has(col.name));

  const columns: {
    name: string;
    type: ColumnType;
    enrichmentIndex?: number;
    enrichment?: Enrichment;
  }[] = [...decoratedExisting, ...newEnrichmentColumns];
  const records = data?.records.slice(0, 10) ?? [];

  const handleDeleteEnrichment = () => {
    if (!deleteEnrichment) return;
    updateConfig({
      dataSourceId: dataSource.id,
      enrichments: enrichments.filter((_, i) => i !== deleteEnrichment.index),
    });
  };

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
        <div className="flex items-center gap-2">
          <AddColumnDialog dataSource={dataSource} />
          <Button
            type="button"
            onClick={onClickEnrichRecords}
            disabled={enriching}
          >
            <RefreshCw className={enriching ? "animate-spin" : ""} />
            {enriching ? "Enriching…" : "Enrich records"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading records…</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => {
                const enrichmentIndex = col.enrichmentIndex;
                const enrichment = col.enrichment;
                return (
                  <th
                    key={col.name}
                    className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-left font-medium text-gray-600 whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1.5">
                      {col.name}
                      {enrichment != null && enrichmentIndex != null && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteEnrichment({
                              index: enrichmentIndex,
                              enrichment,
                            })
                          }
                          className="text-gray-400 hover:text-destructive transition-colors"
                          title="Remove enrichment column"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  </th>
                );
              })}
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

      <AlertDialog
        open={deleteEnrichment !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteEnrichment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove enrichment column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the &quot;Mapped:{" "}
              {deleteEnrichment?.enrichment.name}&quot; column and its enriched
              data from all records.
            </AlertDialogDescription>
            {!DataSourceFeatures[dataSource.config.type].columnDeletion && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ This data source does not support automatic column deletion.
                You will need to manually remove the column from your source.
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEnrichment}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remove column
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
