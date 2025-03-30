"use client";

import { gql, useMutation, useSubscription } from "@apollo/client";
import { LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DataSourceEventSubscription,
  DataSourceEventSubscriptionVariables,
  DataSourceQuery,
  EnqueueImportDataSourceJobMutation,
  EnqueueImportDataSourceJobMutationVariables,
  ImportStatus,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { Link } from "@/components/Link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Button } from "@/shadcn/ui/button";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";
export default function DataSourceDashboard({
  // Mark dataSource as not null or undefined (this is checked in the parent page)
  dataSource,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<DataSourceQuery["dataSource"], null | undefined>;
}) {
  const [importing, setImporting] = useState(isImporting(dataSource));
  const [importError, setImportError] = useState("");
  const [lastImported, setLastImported] = useState(
    dataSource.importInfo?.lastImported || null,
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

  const onClickImportRecords = async () => {
    setImporting(true);
    setImportError("");

    try {
      const result = await enqueueImportDataSourceJob({
        variables: { dataSourceId: dataSource.id },
      });
      if (result.errors) {
        throw new Error(String(result.errors));
      }
    } catch (e) {
      console.error(`Could not schedule import job: ${e}`);
      setImportError("Could not schedule import job.");
      setImporting(false);
    }
  };

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <div className="grid grid-cols-2 gap-12 mb-8">
        <div className="border-r border-border/50 pr-4">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link href="/data-sources">Data sources</Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{dataSource.name}</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-4xl font-medium tracking-tight">
            {dataSource.name}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm mb-4">Record count:</p>
            <p className="text-4xl ">
              {importing ? (
                <div className="flex items-center gap-2">
                  <LoaderPinwheel className="animate-spin" />
                  {recordCount}
                </div>
              ) : (
                recordCount
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
              {importing ? "Importing" : "Import"} records
            </Button>
            {importError ? (
              <div>
                <small>{importError}</small>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Separator className="my-4" />
      {lastImported ? (
        <>
          <DataListRow
            label="Last imported"
            value={new Date(lastImported).toLocaleString()}
          />
          <Separator className="my-4" />
        </>
      ) : null}

      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="flex flex-col ">
          <Label className="text-lg">Config</Label>
          <DataListRow
            label="Type"
            value={dataSource.config.type}
            badge
            border
          />
          <DataListRow label="File Name" value={dataSource.name} border />
          <DataListRow
            label="ID column"
            value={dataSource.config.idColumn}
            border
          />
        </div>
        <div>
          <Label className="text-lg">Geocoding config</Label>
          <DataListRow
            label="Type"
            value={dataSource.geocodingConfig.type}
            border
          />
          <DataListRow
            label="Column"
            value={dataSource.geocodingConfig.column}
            border
          />
          <DataListRow
            label="Area Set Code"
            value={dataSource.geocodingConfig.areaSetCode}
            border
          />
        </div>
      </div>
    </div>
  );
}

const isImporting = (dataSource: DataSourceQuery["dataSource"]) => {
  return Boolean(
    dataSource?.importInfo?.status &&
      [ImportStatus.Importing, ImportStatus.Pending].includes(
        dataSource.importInfo?.status,
      ),
  );
};
