"use client";

import { useMutation } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { format, formatDistanceToNow } from "date-fns";
import { LoaderPinwheel, MapIcon, RefreshCw, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import DataSourceBadge from "@/components/DataSourceBadge";
import DataSourceRecordTypeIcon from "@/components/DataSourceRecordTypeIcon";
import DefinitionList from "@/components/DefinitionList";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { Link } from "@/components/Link";
import { DataSourceConfigLabels } from "@/labels";
import { JobStatus } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import ConfigurationForm from "./components/ConfigurationForm";
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
    ? format(lastImported, "d MMMM yyyy, h:mm a")
    : null;
  const lastImportedFormattedFromNow = lastImported
    ? formatDistanceToNow(lastImported, { addSuffix: true })
    : null;

  const [recordCount, setRecordCount] = useState(dataSource.recordCount || 0);

  const trpc = useTRPC();
  const { mutate: enqueueImportDataSourceJob } = useMutation(
    trpc.dataSource.enqueueImportJob.mutationOptions({
      onError: (error) => {
        console.error(`Could not schedule import job: ${error}`);
        setImportError("Could not schedule import job.");
        setImporting(false);
      },
    }),
  );

  useSubscription(
    trpc.dataSource.events.subscriptionOptions(
      { dataSourceId: dataSource.id },
      {
        onData: (dataSourceEvent) => {
          if (dataSourceEvent.event === "ImportStarted") {
            setImporting(true);
          }
          if (dataSourceEvent.event === "RecordsImported") {
            setRecordCount(dataSourceEvent.count);
          }
          if (dataSourceEvent.event === "ImportFailed") {
            setImporting(false);
            setImportError("Failed to import this data source.");
          }
          if (dataSourceEvent.event === "ImportComplete") {
            setImporting(false);
            setLastImported(dataSourceEvent.at);
          }
        },
      },
    ),
  );

  const onClickImportRecords = useCallback(async () => {
    setImporting(true);
    setImportError("");
    setRecordCount(0);

    enqueueImportDataSourceJob({
      dataSourceId: dataSource.id,
    });
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
  const router = useRouter();

  const [createMapLoading, setCreateMapLoading] = useState(false);
  const { mutate: createMap } = useMutation(
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
          <h1 className="flex items-center gap-2 / text-3xl font-medium tracking-tight">
            <DataSourceRecordTypeIcon
              type={dataSource.recordType}
              withBackground={true}
              className="w-8"
            />
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

      <div className="grid grid-cols-2 gap-20 pb-10">
        <div className="flex flex-col gap-6">
          <h2 className="font-medium text-xl">About this data source</h2>
          <DefinitionList
            items={
              lastImported
                ? [
                    ...mappedInformation,
                    {
                      label: "Last imported",
                      value: `${lastImportedDateReadable} (${lastImportedFormattedFromNow})`,
                    },
                  ]
                : mappedInformation
            }
          />
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
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useMutation(
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
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2Icon />
        Delete data source
      </Button>
      <DeleteConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        description="This action cannot be undone. This will permanently delete your data source."
        onConfirm={() => mutate({ dataSourceId: dataSource.id })}
        isPending={isPending}
        confirmButtonText="Continue"
      />
    </>
  );
}
