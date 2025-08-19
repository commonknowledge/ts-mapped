"use client";

import { QueryResult } from "@apollo/client";
import { ArrowLeft, LoaderPinwheel, PanelLeft } from "lucide-react";
import { Fragment, useContext, useState } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
  PublishedPublicMapQuery,
} from "@/__generated__/types";
import { Link } from "@/components/Link";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import PublicMapGeocoder from "@/components/PublicMap/PublicMapGeocoder";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import DataRecordSidebar from "./DataRecordSidebar";
import DataSourcesSelect from "./DataSourcesSelect";
import EditablePublicMapProperty from "./EditablePublicMapProperty";
import { buildName } from "./utils";

export default function PublicMapSidebar() {
  const { publicMap, editable, dataRecordsQueries, setSearchLocation } =
    useContext(PublicMapContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);
  const [hideSidebar, setHideSidebar] = useState(false);

  // Should never happen
  if (!publicMap) {
    return;
  }

  const loadingSources = Object.values(dataRecordsQueries).some(
    (q) => q.loading
  );

  console.log('description', publicMap.description)

  return (
    <div
      className={cn(
        "absolute top-0 left-0 z-10 bg-white flex",
        hideSidebar ? "h-auto" : "h-full"
      )}
    >
      <div className="flex flex-col h-full w-[280px]">
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-neutral-200 pl-4 py-4 pr-1">
          {editable && (
            <Link
              className="flex gap-2 items-center text-sm text-muted-foreground"
              href={`/map/${publicMap.mapId}?viewId=${publicMap.viewId}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to view
            </Link>
          )}
          <div className="flex items-center justify-between gap-2">
            {editable ? (
              <EditablePublicMapProperty property="name">
                <h1 className="text-xl font-semibold">{publicMap.name}</h1>
              </EditablePublicMapProperty>
            ) : (
              <h1 className="text-xl font-semibold">{publicMap.name}</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideSidebar(!hideSidebar)}
            >
              <PanelLeft className="w-4 h-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
          {editable ? (
            <EditablePublicMapProperty property="description">
              <p>{publicMap.description}</p>
            </EditablePublicMapProperty>
          ) : (
            publicMap.description && <p>{publicMap.description}</p>
          )}
          {editable ? (
            <EditablePublicMapProperty property="descriptionLink">
              <span className="underline">{publicMap.descriptionLink}</span>
            </EditablePublicMapProperty>
          ) : (
            publicMap.descriptionLink && (
              <a
                className="underline"
                href={publicMap.descriptionLink}
                target="_blank"
              >
                {publicMap.descriptionLink}
              </a>
            )
          )}
        </div>
        {!hideSidebar && (
          <>
            <div className="p-4">
              <PublicMapGeocoder onGeocode={(p) => setSearchLocation(p)} />
            </div>
            <div className="overflow-y-auto">
              {/* Listings */}
              {editable && (
                <div className="px-4 mb-4">
                  <DataSourcesSelect />
                </div>
              )}
              {publicMap.dataSourceConfigs.map((dsc) => {
                const dataRecordsQuery = dataRecordsQueries[dsc.dataSourceId];
                return (
                  dataRecordsQuery && (
                    <DataRecordsList
                      key={dsc.dataSourceId}
                      publicMap={publicMap}
                      dataRecordsQuery={dataRecordsQuery}
                      onSelect={setSelectedDataRecord}
                    />
                  )
                );
              })}
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
  publicMap,
  dataRecordsQuery,
  onSelect,
}: {
  publicMap: PublishedPublicMapQuery["publishedPublicMap"];
  dataRecordsQuery: QueryResult<
    PublicMapDataRecordsQuery,
    PublicMapDataRecordsQueryVariables
  >;
  onSelect: (r: { id: string; dataSourceId: string }) => void;
}) {
  const { mapRef } = useContext(MapContext);

  const records = dataRecordsQuery?.data?.dataSource?.records || [];
  const dataSourceConfig = publicMap?.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === dataRecordsQuery.data?.dataSource?.id
  );

  const getName = (record: {
    externalId: string;
    json: Record<string, unknown>;
  }) => {
    const nameColumns = dataSourceConfig?.nameColumns;
    if (!nameColumns?.length) {
      return record.externalId;
    }
    const name = buildName(nameColumns, record.json);
    return name || record.externalId;
  };

  const getDescription = (record: { json: Record<string, unknown> }) => {
    const descriptionColumn = dataSourceConfig?.descriptionColumn;
    return descriptionColumn ? String(record.json[descriptionColumn]) : null;
  };

  return (
    <div className="flex flex-col gap-2 mb-2">
      <h2 className="text-lg font-semibold px-4">
        {dataRecordsQuery.data?.dataSource?.name}
      </h2>
      <ul className="flex flex-col gap-2 px-2">
        {records.map((r) => (
          <li
            className="cursor-pointer hover:bg-accent rounded p-2 flex flex-col gap-2"
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
            {getDescription(r)}
          </li>
        ))}
      </ul>
    </div>
  );
}
