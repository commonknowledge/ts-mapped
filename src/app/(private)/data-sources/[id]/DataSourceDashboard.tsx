"use client";

import { gql, useMutation, useSubscription } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  DataSourceEventSubscription,
  DataSourceEventSubscriptionVariables,
  DataSourceQuery,
  EnqueueImportDataSourceJobMutation,
  EnqueueImportDataSourceJobMutationVariables,
  ImportStatus,
} from "@/__generated__/types";
import styles from "./DataSourceDashboard.module.css";

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
    <div className="container">
      <h1>{dataSource.name}</h1>
      <div>
        <h2>Record count: {recordCount}</h2>
        {lastImported ? (
          <h3>Last imported: {new Date(lastImported).toLocaleString()}</h3>
        ) : null}
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

const isImporting = (dataSource: DataSourceQuery["dataSource"]) => {
  return Boolean(
    dataSource?.importInfo?.status &&
      [ImportStatus.Importing, ImportStatus.Pending].includes(
        dataSource.importInfo?.status,
      ),
  );
};
