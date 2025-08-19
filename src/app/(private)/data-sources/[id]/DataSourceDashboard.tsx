"use client";

import { gql, useMutation, useSubscription } from "@apollo/client";
import { LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AreaSetCode,
  DataSourceEventSubscription,
  DataSourceEventSubscriptionVariables,
  DataSourceQuery,
  EnqueueImportDataSourceJobMutation,
  EnqueueImportDataSourceJobMutationVariables,
  GeocodingType,
  JobStatus,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { Link } from "@/components/Link";
import { DataSourceFeatures } from "@/features";
import {
  AreaSetCodeLabels,
  DataSourceConfigLabels,
  GeocodingTypeLabels,
} from "@/labels";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Button } from "@/shadcn/ui/button";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";
import { DataSourceType } from "@/types";
import { AreaGeocodingType } from "@/zod";

export default function DataSourceDashboard({
  dataSource,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<DataSourceQuery["dataSource"], null | undefined>;
}) {
  const [importing, setImporting] = useState(isImporting(dataSource));
  const [importError, setImportError] = useState("");
  const [lastImported, setLastImported] = useState(
    dataSource.importInfo?.lastCompleted || null,
  );
  const [recordCount, setRecordCount] = useState(
    dataSource.recordCount?.count || 0,
  );

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
  };

  const isPostcodeData =
    dataSource.geocodingConfig.areaSetCode === AreaSetCode.PC;
  const isAreaData = dataSource.geocodingConfig.type in AreaGeocodingType;

  const features = DataSourceFeatures[dataSource.config.type as DataSourceType];

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
            <p className="text-4xl">
              {importing ? (
                <span className="flex items-center gap-2">
                  <LoaderPinwheel className="animate-spin" />
                  {recordCount}
                </span>
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
            {importError && (
              <div>
                <span className="text-xs text-red-500">{importError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Separator className="my-4" />
      {lastImported && (
        <>
          <DataListRow
            label="Last imported"
            value={new Date(lastImported).toLocaleString()}
          />
          <Separator className="my-4" />
        </>
      )}

      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="flex flex-col ">
          <Label className="text-xl">Import config</Label>
          {Object.keys(dataSource.config).map((k) => (
            <DataListRow
              key={k}
              label={
                k in DataSourceConfigLabels
                  ? DataSourceConfigLabels[
                      k as keyof typeof DataSourceConfigLabels
                    ]
                  : k
              }
              value={
                typeof dataSource.config[k] === "string"
                  ? dataSource.config[k]
                  : JSON.stringify(dataSource.config[k])
              }
              badge={k === "type"}
              border
            />
          ))}
        </div>
        <div>
          <div className="mb-4 flex justify-between">
            <Label className="text-xl">Data config</Label>

            <Button asChild={true}>
              <Link href={`/data-sources/${dataSource.id}/config`}>Edit</Link>
            </Button>
          </div>
          <div className="mb-4">
            <Label className="text-lg">Columns</Label>
            <DataListRow
              label="Name columns"
              value={
                dataSource.columnRoles.nameColumns?.length
                  ? dataSource.columnRoles.nameColumns.join(", ")
                  : "None"
              }
              border
            />
          </div>
          <div className="mb-4">
            <Label className="text-lg">Geocoding</Label>
            <DataListRow
              label="Geocoding type"
              value={
                isPostcodeData
                  ? GeocodingTypeLabels.Postcode
                  : GeocodingTypeLabels[
                      dataSource.geocodingConfig.type as GeocodingType
                    ]
              }
              border
            />
            <DataListRow
              label="Location column(s)"
              value={
                dataSource.geocodingConfig.column
                  ? `"${dataSource.geocodingConfig.column}"`
                  : dataSource.geocodingConfig.columns?.length
                    ? dataSource.geocodingConfig.columns.join(", ")
                    : "None"
              }
              border
            />
            {isAreaData && !isPostcodeData && (
              <DataListRow
                label="Area type"
                value={
                  AreaSetCodeLabels[
                    dataSource.geocodingConfig.areaSetCode as AreaSetCode
                  ] || "None"
                }
                border
              />
            )}
          </div>
          {features.autoImport && (
            <div className="mb-4">
              <Label className="text-lg">Auto-import</Label>
              <DataListRow
                label="Enabled"
                value={dataSource.autoImport ? "Yes" : "No"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const isImporting = (dataSource: DataSourceQuery["dataSource"]) => {
  return Boolean(
    dataSource?.importInfo?.status &&
      [JobStatus.Running, JobStatus.Pending].includes(
        dataSource.importInfo?.status,
      ),
  );
};
