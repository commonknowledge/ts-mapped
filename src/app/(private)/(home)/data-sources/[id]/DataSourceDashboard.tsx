"use client";

import { gql, useMutation, useSubscription } from "@apollo/client";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { LoaderPinwheel, MapIcon, RefreshCw, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { JobStatus } from "@/__generated__/types";
import DataSourceBadge from "@/components/DataSourceBadge";
import DefinitionList from "@/components/DefinitionList";
import { Link } from "@/components/Link";
import { DataSourceConfigLabels } from "@/labels";
import { useTRPC } from "@/services/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shadcn/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import ConfigurationForm from "./components/ConfigurationForm";
import type {
  DataSourceEventSubscription,
  DataSourceEventSubscriptionVariables,
  EnqueueImportDataSourceJobMutation,
  EnqueueImportDataSourceJobMutationVariables,
} from "@/__generated__/types";
import type { RouterOutputs } from "@/services/trpc/react";

export function DataSourceDashboard({
  dataSource,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
}) {
  const [importing, setImporting] = useState(isImporting(dataSource));
  const [importError, setImportError] = useState("");
  const [lastImported, setLastImported] = useState(
    dataSource.importInfo?.lastCompleted || null,
  );

  const lastImportedDateReadable = lastImported
    ? format(new Date(lastImported), "d MMMM yyyy, h:mm a")
    : null;
  const lastImportedFormattedFromNow = lastImported
    ? formatDistanceToNow(new Date(lastImported), { addSuffix: true })
    : null;

  const [recordCount, setRecordCount] = useState(dataSource.recordCount || 0);

  const [enqueueImportDataSourceJob] = useMutation<
    EnqueueImportDataSourceJobMutation,
    EnqueueImportDataSourceJobMutationVariables
  >(gql`
    mutation EnqueueImportDataSourceJob($dataSourceId: String!) {
      enqueueImportDataSourceJob(dataSourceId: $dataSourceId) {
        code
      }
    }
  `);

  const { data: dataSourceEventData } = useSubscription<
    DataSourceEventSubscription,
    DataSourceEventSubscriptionVariables
  >(
    gql`
      subscription DataSourceEvent($dataSourceId: String!) {
        dataSourceEvent(dataSourceId: $dataSourceId) {
          importStarted {
            at
          }
          importComplete {
            at
          }
          importFailed {
            at
          }
          recordsImported {
            count
          }
        }
      }
    `,
    { variables: { dataSourceId: dataSource.id } },
  );

  const dataSourceEvent = dataSourceEventData?.dataSourceEvent;

  useEffect(() => {
    if (!dataSourceEvent) {
      return;
    }
    if (dataSourceEvent.importStarted) {
      setImporting(true);
    }
    if (dataSourceEvent.recordsImported?.count) {
      setRecordCount(dataSourceEvent.recordsImported?.count);
    }
    if (dataSourceEvent.importFailed) {
      setImporting(false);
      setImportError("Failed to import this data source.");
    }
    if (dataSourceEvent.importComplete) {
      setImporting(false);
      setLastImported(dataSourceEvent.importComplete.at);
    }
  }, [dataSourceEvent]);

  const onClickImportRecords = useCallback(async () => {
    setImporting(true);
    setImportError("");
    setRecordCount(0);

    try {
      const result = await enqueueImportDataSourceJob({
        variables: { dataSourceId: dataSource.id },
      });
      if (result.data?.enqueueImportDataSourceJob?.code !== 200) {
        throw new Error(String(result.errors || "Unknown error"));
      }
    } catch (e) {
      console.error(`Could not schedule import job: ${e}`);
      setImportError("Could not schedule import job.");
      setImporting(false);
    }
  }, [dataSource.id, enqueueImportDataSourceJob]);

  const mappedInformation = Object.keys(dataSource.config).map((k) => ({
    label:
      k in DataSourceConfigLabels
        ? DataSourceConfigLabels[k as keyof typeof DataSourceConfigLabels]
        : k,
    value:
      k === "type" ? (
        <DataSourceBadge type={dataSource.config[k]} />
      ) : typeof dataSource.config[k as keyof typeof dataSource.config] ===
        "string" ? (
        dataSource.config[k as keyof typeof dataSource.config]
      ) : (
        JSON.stringify(dataSource.config[k as keyof typeof dataSource.config])
      ),
  }));
  const trpc = useTRPC();
  const router = useRouter();

  const [createMapLoading, setCreateMapLoading] = useState(false);
  const { mutate: createMap } = useTanstackMutation(
    trpc.map.createFromDataSource.mutationOptions({
      onSuccess: (data) => {
        router.push(`/map/${data.id}`);
      },
      onError: () => {
        toast.error("Failed to create map");
        setCreateMapLoading(false);
      },
    }),
  );

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <div className="flex gap-12">
        <div className="grow">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link href="/data-sources">Data sources</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{dataSource.name}</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-medium tracking-tight">
            {dataSource.name}
          </h1>
          <p className="mt-1 text-2xl text-muted-foreground">
            {importing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="animate-spin" />
                {recordCount} records
              </span>
            ) : (
              <>{recordCount} records</>
            )}
          </p>
        </div>

        <div className="flex flex-row items-start gap-2">
          {importError && (
            <div>
              <span className="text-xs text-red-500">{importError}</span>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClickImportRecords}
            disabled={importing}
            size="lg"
          >
            <RefreshCw className={importing ? "animate-spin" : ""} />
            {importing ? "Importing" : "Import"}
          </Button>

          <Button
            onClick={() => {
              setCreateMapLoading(true);
              createMap({
                organisationId: dataSource.organisationId,
                dataSourceId: dataSource.id,
              });
            }}
            disabled={createMapLoading}
          >
            {createMapLoading ? (
              <LoaderPinwheel className="animate-spin" />
            ) : (
              <MapIcon />
            )}
            Create map
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      {lastImported && (
        <>
          <h2 className="mb-2 font-medium text-xl">Last imported</h2>
          <time className="text-sm">{lastImportedDateReadable}</time>
          {lastImportedFormattedFromNow && (
            <span className="text-neutral-500 text-sm flex items-center gap-1 ">
              ({lastImportedFormattedFromNow})
            </span>
          )}
          <Separator className="my-8" />
        </>
      )}

      <div className="grid grid-cols-2 gap-20 pb-10">
        <div className="flex flex-col gap-6">
          <h2 className="font-medium text-xl">About this data source</h2>
          <DefinitionList items={mappedInformation} />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-medium text-xl">Configuration</h2>
          <ConfigurationForm dataSource={dataSource} />
          <Separator />
          <h2 className="font-medium text-xl">Danger zone</h2>
          <div>
            <DeleteDataSourceButton dataSource={dataSource} />
          </div>
        </div>
      </div>
    </div>
  );
}

const isImporting = (dataSource: RouterOutputs["dataSource"]["byId"]) => {
  return Boolean(
    dataSource?.importInfo?.status &&
      [JobStatus.Running, JobStatus.Pending].includes(
        dataSource.importInfo?.status,
      ),
  );
};

function DeleteDataSourceButton({
  dataSource,
}: {
  dataSource: RouterOutputs["dataSource"]["byId"];
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const { mutate, isPending } = useTanstackMutation(
    trpc.dataSource.delete.mutationOptions({
      onSuccess: () => {
        router.replace("/data-sources");
        toast.success("Data source deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete data source");
      },
    }),
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon />
          Delete data source
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your data
            source.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => mutate({ dataSourceId: dataSource.id })}
          >
            {isPending ? "Deleting..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
