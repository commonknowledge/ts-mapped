"use client";

import { gql, useMutation, useSubscription } from "@apollo/client";
import { LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AreaSetCode,
  DataSourceEnrichmentEventSubscription,
  DataSourceEnrichmentEventSubscriptionVariables,
  EnqueueEnrichDataSourceJobMutation,
  EnqueueEnrichDataSourceJobMutationVariables,
  EnrichmentSourceType,
  JobStatus,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { Link } from "@/components/Link";
import { AreaSetCodeLabels, EnrichmentSourceTypeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";
import { RouterOutputs } from "@/utils/trpc/react";

export function DataSourceEnrichmentDashboard({
  dataSource,
}: {
  dataSource: RouterOutputs["dataSource"]["byId"];
}) {
  const [enriching, setEnriching] = useState(isEnriching(dataSource));
  const [enrichmentError, setEnrichmentError] = useState("");
  const [lastEnriched, setLastEnriched] = useState(
    dataSource.enrichmentInfo?.lastCompleted || null,
  );
  const [enrichmentCount, setEnrichmentCount] = useState(0);

  const [enqueueEnrichDataSourceJob] = useMutation<
    EnqueueEnrichDataSourceJobMutation,
    EnqueueEnrichDataSourceJobMutationVariables
  >(gql`
    mutation EnqueueEnrichDataSourceJob($dataSourceId: String!) {
      enqueueEnrichDataSourceJob(dataSourceId: $dataSourceId) {
        code
      }
    }
  `);

  const { data: dataSourceEventData } = useSubscription<
    DataSourceEnrichmentEventSubscription,
    DataSourceEnrichmentEventSubscriptionVariables
  >(
    gql`
      subscription DataSourceEnrichmentEvent($dataSourceId: String!) {
        dataSourceEvent(dataSourceId: $dataSourceId) {
          enrichmentComplete {
            at
          }
          enrichmentFailed {
            at
          }
          recordsEnriched {
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
    if (dataSourceEvent.recordsEnriched?.count) {
      setEnrichmentCount(dataSourceEvent.recordsEnriched?.count);
    }
    if (dataSourceEvent.enrichmentFailed) {
      setEnriching(false);
      setEnrichmentError("Failed to enrich this data source.");
    }
    if (dataSourceEvent.enrichmentComplete) {
      setEnriching(false);
      setLastEnriched(dataSourceEvent.enrichmentComplete.at);
    }
  }, [dataSourceEvent]);

  const onClickEnrichRecords = async () => {
    setEnriching(true);
    setEnrichmentError("");
    setEnrichmentCount(0);

    try {
      const result = await enqueueEnrichDataSourceJob({
        variables: { dataSourceId: dataSource.id },
      });
      if (result.data?.enqueueEnrichDataSourceJob?.code !== 200) {
        throw new Error(String(result.errors || "Unknown error"));
      }
    } catch (e) {
      console.error(`Could not schedule enrichment job: ${e}`);
      setEnrichmentError("Could not schedule enrichment job.");
      setEnriching(false);
    }
  };

  const displayEnrichmentProgress = enrichmentCount > 0 || enriching;

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <div className="grid grid-cols-2 gap-12 mb-8">
        <div className="border-r border-border/50 pr-4">
          <h1 className="text-3xl font-medium tracking-tight">Enrichment</h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            {displayEnrichmentProgress && (
              <>
                <p className="text-muted-foreground text-sm mb-4">
                  Enrichment count:
                </p>
                <p className="text-4xl">
                  {enriching ? (
                    <span className="flex items-center gap-2">
                      <LoaderPinwheel className="animate-spin" />
                      {enrichmentCount}
                    </span>
                  ) : (
                    enrichmentCount
                  )}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 ">
            <Button
              type="button"
              onClick={onClickEnrichRecords}
              disabled={enriching}
              size="lg"
            >
              {enriching ? "Enriching" : "Enrich"} records
            </Button>
            {enrichmentError && (
              <div>
                <span className="text-xs text-red-500">{enrichmentError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Separator className="my-4" />
      {lastEnriched && (
        <>
          <DataListRow
            label="Last enriched"
            value={new Date(lastEnriched).toLocaleString()}
          />
          <Separator className="my-4" />
        </>
      )}

      <div className="flex flex-col ">
        <div className="mb-4 flex justify-between">
          <Label className="text-xl">Enrichment config</Label>
          <Button asChild={true}>
            <Link href={`/data-sources/${dataSource.id}/enrichment`}>Edit</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {dataSource.enrichments.map((enrichment, i) => (
            <div className="mb-4" key={i}>
              <Label className="text-lg">
                +&nbsp;
                {
                  EnrichmentSourceTypeLabels[
                    enrichment.sourceType as EnrichmentSourceType
                  ]
                }
              </Label>
              {enrichment.sourceType === EnrichmentSourceType.Area && (
                <>
                  <DataListRow
                    label="Area type"
                    value={
                      AreaSetCodeLabels[enrichment.areaSetCode as AreaSetCode]
                    }
                    border
                  />
                  <DataListRow
                    label="Area info"
                    value={`Area ${enrichment.areaProperty}`}
                    border
                  />
                </>
              )}
              {enrichment.sourceType === EnrichmentSourceType.DataSource && (
                <>
                  <DataListRow
                    label="Data source"
                    value={
                      dataSource.enrichmentDataSources?.find(
                        (dataSource) =>
                          dataSource.id === enrichment.dataSourceId,
                      )?.name || "Unknown"
                    }
                    border
                  />
                  <DataListRow
                    label="Data source column"
                    value={enrichment.dataSourceColumn || ""}
                    border
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
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
