"use client";

import { gql, useMutation, useSubscription } from "@apollo/client";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  DataSourceEventSubscription,
  DataSourceEventSubscriptionVariables,
  EnqueueImportDataSourceJobMutation,
  EnqueueImportDataSourceJobMutationVariables,
  JobStatus,
} from "@/__generated__/types";
import DataSourceBadge from "@/components/DataSourceBadge";
import DefinitionList from "@/components/DefinitionList";
import { Link } from "@/components/Link";
import { DataSourceConfigLabels } from "@/labels";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { RouterOutputs } from "@/utils/trpc/react";
import ConfigurationForm from "./components/ConfigurationForm";

export function DataSourceDashboard({
  dataSource,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
}) {
  const [importing, setImporting] = useState(isImporting(dataSource));
  const [importError, setImportError] = useState("");
  const [lastImported, setLastImported] = useState(
    dataSource.importInfo?.lastCompleted || null
  );
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
    { variables: { dataSourceId: dataSource.id } }
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

        <div className="flex flex-col items-end gap-2 ">
          <Button
            type="button"
            onClick={onClickImportRecords}
            disabled={importing}
            size="lg"
          >
            <RefreshCw className={importing ? "animate-spin" : ""} />
            {importing ? "Importing" : "Import"}
          </Button>

          {importError && (
            <div>
              <span className="text-xs text-red-500">{importError}</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {lastImported && (
        <>
          <h2 className="mb-2 font-medium text-xl">Last imported</h2>
          <time className="text-sm">
            {new Date(lastImported).toLocaleString("en-GB")}
          </time>
          <Separator className="my-8" />
        </>
      )}

      <div className="grid grid-cols-2 gap-20">
        <div className="flex flex-col gap-6">
          <h2 className="font-medium text-xl">About this data source</h2>
          <DefinitionList items={mappedInformation} />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-medium text-xl">Configuration</h2>
          <ConfigurationForm dataSource={dataSource} />
        </div>
      </div>
    </div>
  );
}

const isImporting = (dataSource: RouterOutputs["dataSource"]["byId"]) => {
  return Boolean(
    dataSource?.importInfo?.status &&
      [JobStatus.Running, JobStatus.Pending].includes(
        dataSource.importInfo?.status
      )
  );
};
