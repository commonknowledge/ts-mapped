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
          <h1 className="text-3xl font-bold tracking-[-0.0085em]">
            {dataSource.name}
          </h1>
          <p className="mt-1 text-2xl text-muted-foreground">
            {importing ? (
              <span className="flex items-center gap-2">
                <LoaderPinwheel className="animate-spin" />
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
            {importing ? "Importing" : "Import"} records
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
          <h2 className="mb-2 font-bold text-xl">Last imported</h2>
          <time className="text-sm">
            {new Date(lastImported).toLocaleString()}
          </time>
          <Separator className="my-8" />
        </>
      )}

      <div className="grid grid-cols-2 gap-12">
        <div className="flex flex-col gap-6">
          <h2 className="h-8 font-bold text-xl">About this data source</h2>
          <dl className="flex flex-col gap-6 text-sm">
            {Object.keys(dataSource.config).map((k) => (
              <div key={k}>
                <dt className="mb-2 font-medium">
                  {k in DataSourceConfigLabels
                    ? DataSourceConfigLabels[
                        k as keyof typeof DataSourceConfigLabels
                      ]
                    : k}
                </dt>
                <dd className="max-w-[45ch] overflow-hidden overflow-ellipsis">
                  {typeof dataSource.config[k] === "string"
                    ? dataSource.config[k]
                    : JSON.stringify(dataSource.config[k])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <h2 className="font-bold text-xl">Configuration</h2>
            <Button asChild={true} className="h-8">
              <Link href={`/data-sources/${dataSource.id}/config`}>Edit</Link>
            </Button>
          </div>
          <dl className="flex flex-col gap-6 text-sm">
            <div>
              <dt className="mb-2 font-medium">Name column</dt>
              <dd className="max-w-[45ch] whitespace-nowrap overflow-hidden overflow-ellipsis">
                {dataSource.columnRoles.nameColumns?.length
                  ? dataSource.columnRoles.nameColumns.join(", ")
                  : "None"}
              </dd>
            </div>
            <div>
              <dt className="mb-2 font-medium">Location column</dt>
              <dd className="max-w-[45ch] overflow-hidden overflow-ellipsis">
                {dataSource.geocodingConfig.column
                  ? `"${dataSource.geocodingConfig.column}"`
                  : dataSource.geocodingConfig.columns?.length
                    ? dataSource.geocodingConfig.columns.join(", ")
                    : "None"}
              </dd>
            </div>
            <div>
              <dt className="mb-2 font-medium">Geocoding type</dt>
              <dd className="max-w-[45ch] overflow-hidden overflow-ellipsis">
                {isPostcodeData
                  ? GeocodingTypeLabels.Postcode
                  : GeocodingTypeLabels[
                      dataSource.geocodingConfig.type as GeocodingType
                    ]}
              </dd>
            </div>

            {isAreaData && !isPostcodeData && (
              <div>
                <dt className="mb-2 font-medium">Area type</dt>
                <dd className="max-w-[45ch] overflow-hidden overflow-ellipsis">
                  {AreaSetCodeLabels[
                    dataSource.geocodingConfig.areaSetCode as AreaSetCode
                  ] || "None"}
                </dd>
              </div>
            )}
            {features.autoImport && (
              <div>
                <dt className="mb-2 font-medium">Auto-import enabled</dt>
                <dl>{dataSource.autoImport ? "Yes" : "No"}</dl>
              </div>
            )}
          </dl>
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
