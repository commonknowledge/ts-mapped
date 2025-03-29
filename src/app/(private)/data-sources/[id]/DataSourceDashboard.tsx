"use client";

import { gql, useMutation, useSubscription } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  DataSourceEventSubscription,
  DataSourceEventSubscriptionVariables,
  DataSourceQuery,
  TriggerImportDataSourceJobMutation,
  TriggerImportDataSourceJobMutationVariables,
} from "@/__generated__/types";
import styles from "./DataSourceDashboard.module.css";

export default function DataSourceDashboard({
  // Mark dataSource as not null or undefined (this is checked in the parent page)
  dataSource,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<DataSourceQuery["dataSource"], null | undefined>;
}) {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [recordCount, setRecordCount] = useState(dataSource.recordCount || 0);

  const [triggerImportDataSourceJob] = useMutation<
    TriggerImportDataSourceJobMutation,
    TriggerImportDataSourceJobMutationVariables
  >(gql`
    mutation TriggerImportDataSourceJob($dataSourceId: String!) {
      triggerImportDataSourceJob(dataSourceId: $dataSourceId) {
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
    if (dataSourceEvent.importComplete) {
      setImporting(false);
    }
  }, [dataSourceEvent]);

  const onClickImportRecords = async () => {
    setImporting(true);
    setImportError("");

    try {
      const result = await triggerImportDataSourceJob({
        variables: { dataSourceId: dataSource.id },
      });
      if (result.errors) {
        throw new Error(String(result.errors));
      }
    } catch (e) {
      console.error(`Could not trigger import job: ${e}`);
      setImportError("Could not trigger import job.");
      setImporting(false);
    }
  };

  return (
    <div className="container">
      <h1>{dataSource.name}</h1>
      <div>
        <h2>Record count: {recordCount}</h2>
        <button
          type="button"
          onClick={onClickImportRecords}
          disabled={importing}
        >
          {importing ? "Importing" : "Import"} records
        </button>
        {importError ? (
          <div>
            <small>{importError}</small>
          </div>
        ) : null}
      </div>
      <label>Config</label>
      <pre className={styles.config}>{JSON.stringify(dataSource.config)}</pre>
      <label>Geocoding Config</label>
      <pre className={styles.config}>
        {JSON.stringify(dataSource.geocodingConfig)}
      </pre>
    </div>
  );
}
