"use client";

import { QueryResult } from "@apollo/client";
import { Check, LoaderPinwheel, PanelLeft, X } from "lucide-react";
import { Fragment, useContext, useMemo, useState } from "react";
import {
  PublicMapColumnType,
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
} from "@/__generated__/types";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import PublicMapGeocoder from "@/components/PublicMap/PublicMapGeocoder";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";

export default function PublicMapSidebar() {
  const { publicMap, dataRecordsQueries, setSearchLocation } =
    useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);
  const [hideSidebar, setHideSidebar] = useState(false);

  // Should never happen
  if (!publicMap) {
    return;
  }

  const loadingSources = Object.values(dataRecordsQueries).some(
    (q) => q.loading,
  );

  return (
    <div
      className={cn(
        "absolute top-0 left-0 z-10 bg-white flex",
        hideSidebar ? "h-auto" : "h-full",
      )}
    >
      <div className="flex flex-col h-full w-[280px]">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200 pl-4 pt-1 pr-1 pb-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-semibold">{publicMap.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideSidebar(!hideSidebar)}
            >
              <PanelLeft className="w-4 h-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
          {publicMap.description && <p>{publicMap.description}</p>}
          {publicMap.descriptionLink && (
            <a
              className="underline"
              href={publicMap.descriptionLink}
              target="_blank"
            >
              {publicMap.descriptionLink}
            </a>
          )}
        </div>
        {!hideSidebar && (
          <>
            <div className="p-4">
              <PublicMapGeocoder onGeocode={(p) => setSearchLocation(p)} />
            </div>
            <div className="overflow-y-auto">
              {/* Listings */}
              {Object.keys(dataRecordsQueries).map((id) => (
                <DataRecordsList
                  key={id}
                  dataRecordsQuery={dataRecordsQueries[id]}
                  onSelect={setSelectedDataRecord}
                />
              ))}
              {loadingSources && (
                <div className="p-4 pt-0">
                  <LoaderPinwheel className="animate-spin" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {!hideSidebar && <DataRecordSidebar />}
    </div>
  );
}

function DataRecordsList({
  dataRecordsQuery,
  onSelect,
}: {
  dataRecordsQuery: QueryResult<
    PublicMapDataRecordsQuery,
    PublicMapDataRecordsQueryVariables
  >;
  onSelect: (r: { id: string; dataSourceId: string }) => void;
}) {
  const { mapRef } = useContext(MapContext);

  const records = dataRecordsQuery?.data?.dataSource?.records || [];

  const getName = (record: {
    externalId: string;
    json: Record<string, unknown>;
  }) => {
    const nameColumns =
      dataRecordsQuery.data?.dataSource?.columnRoles.nameColumns;
    if (!nameColumns?.length) {
      return record.externalId;
    }
    const name = buildName(nameColumns, record.json);
    return name || record.externalId;
  };

  return (
    <div className="flex flex-col gap-2 mb-2">
      <h2 className="text-lg font-semibold px-4">
        {dataRecordsQuery.data?.dataSource?.name}
      </h2>
      <ul className="flex flex-col gap-2 px-2">
        {records.map((r) => (
          <li
            className="cursor-pointer hover:bg-accent rounded p-2"
            key={r.id}
            role="button"
            onClick={() => {
              if (dataRecordsQuery.data?.dataSource?.id) {
                onSelect({
                  id: r.id,
                  dataSourceId: dataRecordsQuery.data?.dataSource?.id,
                });
              }
              if (r.geocodePoint) {
                mapRef?.current?.flyTo({
                  center: r.geocodePoint,
                  zoom: 14,
                });
              }
            }}
          >
            {getName(r)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataRecordSidebar() {
  const { selectedDataRecord } = useContext(DataRecordContext);
  const { dataRecordsQueries, publicMap } = useContext(PublicMapContext);
  const selectedDataRecordDetails = useMemo(() => {
    if (!selectedDataRecord) {
      return null;
    }
    const dataRecordsQuery =
      dataRecordsQueries[selectedDataRecord.dataSourceId];
    return dataRecordsQuery.data?.dataSource?.records?.find(
      (r) => r.id === selectedDataRecord.id,
    );
  }, [dataRecordsQueries, selectedDataRecord]);

  if (!selectedDataRecordDetails || !publicMap) {
    return null;
  }

  const dataSourceConfig = publicMap.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === selectedDataRecord?.dataSourceId,
  );

  const name = buildName(
    dataSourceConfig?.nameColumns || [],
    selectedDataRecordDetails.json,
  );
  const description =
    selectedDataRecordDetails.json[dataSourceConfig?.descriptionColumn || ""];
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  return (
    <div className="flex flex-col gap-4 py-2 px-4 w-[280px]">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-lg">
          {dataSourceConfig?.nameLabel || "Name"}
        </span>
        <span>{name}</span>
      </div>
      {description && (
        <div className="flex flex-col gap-2">
          <span className="font-medium">
            {dataSourceConfig?.descriptionLabel || "Description"}
          </span>
          <span>{description}</span>
        </div>
      )}
      {additionalColumns.map((columnConfig, i) => (
        <div key={i} className="flex flex-col gap-2">
          <span className="font-medium">{columnConfig.label}</span>
          {columnConfig.type === PublicMapColumnType.Boolean ? (
            <CheckList
              sourceColumns={columnConfig.sourceColumns}
              json={selectedDataRecordDetails.json}
            />
          ) : columnConfig.type === PublicMapColumnType.CommaSeparatedList ? (
            <CommaSeparatedList
              sourceColumns={columnConfig.sourceColumns}
              json={selectedDataRecordDetails.json}
            />
          ) : (
            <span>
              {columnConfig.sourceColumns
                .map((c) => selectedDataRecordDetails.json[c])
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function CheckList({
  sourceColumns,
  json,
}: {
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  const toBoolean = (val: unknown): boolean => {
    if (!val) {
      return false;
    }
    if (["false", "0", "no"].includes(String(val).toLowerCase())) {
      return false;
    }
    return Boolean(val);
  };

  return (
    <div className="grid grid-cols-6 gap-2">
      {sourceColumns.map((column) => (
        <Fragment key={column}>
          <div className="col-span-1">
            {toBoolean(json[column]) ? <Check /> : <X />}
          </div>
          <div className="col-span-5">{column}</div>
        </Fragment>
      ))}
    </div>
  );
}

function CommaSeparatedList({
  sourceColumns,
  json,
}: {
  sourceColumns: string[];
  json: Record<string, unknown>;
}) {
  const values = sourceColumns.flatMap((c) =>
    String(json[c] || "")
      .split(",")
      .map((s) => s.trim()),
  );

  return (
    <div>
      {values.map((v) => (
        <span className="inline-block rounded-2xl bg-accent mr-2 p-2" key={v}>
          {v}
        </span>
      ))}
    </div>
  );
}

function buildName(nameColumns: string[], json: Record<string, unknown>) {
  return nameColumns
    .map((c) => String(json[c] || "").trim())
    .filter(Boolean)
    .join(" ");
}
