"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { HelpCircle, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ENRICHMENT_COLUMN_PREFIX } from "@/constants";
import { DataSourceFeatures } from "@/features";
import { ColumnType, JobStatus } from "@/server/models/DataSource";
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
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { enrichmentColumnName } from "@/utils/dataRecord";
import EnrichmentColumnDialog from "../components/EnrichmentColumnDialog";

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

  const [deleteColumn, setDeleteColumn] = useState<string | null>(null);

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

  const { mutate: deleteEnrichmentColumns } = useMutation(
    trpc.dataSource.deleteEnrichmentColumns.mutationOptions({
      onSuccess: () => {
        toast.success("Column removed successfully");
        setDeleteColumn(null);
        queryClient.invalidateQueries({
          queryKey: trpc.dataSource.enrichmentPreview.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.dataSource.byId.queryKey({
            dataSourceId: dataSource.id,
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

  const records = useMemo(() => data?.records.slice(0, 10) ?? [], [data]);

  const existingColumns = dataSource.columnDefs ?? [];
  const existingColumnNames = new Set(existingColumns.map((col) => col.name));
  const enrichments = dataSource.enrichments ?? [];

  const newEnrichmentColumns = enrichments
    .map((e, i) => ({
      name: enrichmentColumnName(e.name),
      type: ColumnType.String,
      enrichmentIndex: i,
      enrichment: e,
    }))
    .filter((col) => !existingColumnNames.has(col.name));

  const newEnrichmentColumnNames = new Set(
    newEnrichmentColumns.map((col) => col.name),
  );

  const previewRecordIds = useMemo(() => records.map((r) => r.id), [records]);

  const { data: previewData, isFetching: isPreviewFetching } = useQuery(
    trpc.dataSource.enrichmentPreview.queryOptions(
      {
        dataSourceId: dataSource.id,
        dataRecordIds: previewRecordIds,
      },
      {
        enabled: newEnrichmentColumns.length > 0 && previewRecordIds.length > 0,
      },
    ),
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
            queryClient.invalidateQueries({
              queryKey: trpc.dataRecord.list.queryKey({
                dataSourceId: dataSource.id,
                page: 0,
              }),
            });
            queryClient.invalidateQueries({
              queryKey: trpc.dataSource.byId.queryKey({
                dataSourceId: dataSource.id,
              }),
            });
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

  const columns: {
    name: string;
    type: ColumnType;
  }[] = [];
  const seenColumnNames = new Set<string>();
  for (const col of [...existingColumns, ...newEnrichmentColumns]) {
    if (!seenColumnNames.has(col.name)) {
      seenColumnNames.add(col.name);
      columns.push(col);
    }
  }

  const handleDeleteColumn = () => {
    if (!deleteColumn) return;
    deleteEnrichmentColumns({
      dataSourceId: dataSource.id,
      externalColumnNames: [deleteColumn],
    });
  };

  return (
    <div className="p-4 mx-auto w-full">
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
          <EnrichmentColumnDialog dataSource={dataSource} />
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {columns.map((col) => {
                  const isPreview = newEnrichmentColumnNames.has(col.name);
                  return (
                    <th
                      key={col.name}
                      className={`border border-gray-200 px-3 py-1.5 text-left font-medium whitespace-nowrap ${
                        isPreview
                          ? "bg-amber-50 text-amber-700 border-l-2 border-l-amber-300"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {col.name}
                        {isPreview && (
                          <Tooltip>
                            <TooltipTrigger asChild={true}>
                              <span className="inline-flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 border-amber-300 text-amber-600"
                                >
                                  Preview
                                </Badge>
                                <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-56">
                              Click <strong>&quot;Enrich records&quot;</strong>{" "}
                              to save this column to all records.
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {col.name.startsWith(ENRICHMENT_COLUMN_PREFIX) && (
                          <button
                            type="button"
                            onClick={() => setDeleteColumn(col.name)}
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
                  {columns.map((col) => {
                    const isPreview = newEnrichmentColumnNames.has(col.name);
                    const persistedValue = record.json[col.name];
                    const hasPersisted =
                      persistedValue !== undefined && persistedValue !== null;
                    const previewValue =
                      isPreview && !hasPersisted
                        ? previewData?.[record.id]?.[col.name]
                        : undefined;
                    const showPreview = isPreview && !hasPersisted;
                    const displayValue = hasPersisted
                      ? persistedValue
                      : previewValue;

                    const missingGeocode = !record.geocodePoint;

                    const cell = (
                      <td
                        key={col.name}
                        className={`border border-gray-200 px-3 py-1.5 whitespace-nowrap max-w-[300px] truncate ${
                          showPreview
                            ? "italic text-muted-foreground border-l-2 border-l-amber-300 bg-amber-50/40"
                            : ""
                        }`}
                      >
                        {showPreview && isPreviewFetching && !displayValue ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                        ) : (
                          formatCell(displayValue)
                        )}
                      </td>
                    );

                    if (missingGeocode) {
                      return (
                        <Tooltip key={col.name}>
                          <TooltipTrigger asChild={true}>{cell}</TooltipTrigger>
                          <TooltipContent>
                            Record has no geocode result
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return cell;
                  })}
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
        </div>
      )}

      <AlertDialog
        open={deleteColumn !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteColumn(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove enrichment column?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the &quot;{deleteColumn}&quot; column and its
              data from all records.
            </AlertDialogDescription>
            {deleteColumn &&
              !DataSourceFeatures[dataSource.config.type].columnDeletion &&
              existingColumnNames.has(deleteColumn) && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ This data source does not support automatic column
                  deletion. You will need to manually remove the column from
                  your source.
                </p>
              )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColumn}
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
