"use client";

import { gql, useQuery } from "@apollo/client";
import { LoaderPinwheel, PanelLeft } from "lucide-react";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
} from "@/__generated__/types";
import { MapContext } from "@/components/Map/context/MapContext";
import { SORT_BY_LOCATION, SORT_BY_NAME_COLUMNS } from "@/constants";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { Point } from "@/types";
import { PublicMapContext } from "./PublicMapContext";
import PublicMapGeocoder from "./PublicMapGeocoder";

export default function PublicMapSidebar() {
  const { publicMap } = useContext(PublicMapContext);
  const { mapConfig } = useContext(MapContext);
  const [hideSidebar, setHideSidebar] = useState(false);

  const dataSourceIds = [mapConfig.membersDataSourceId]
    .concat(mapConfig.markerDataSourceIds)
    .filter(Boolean);

  const [loadedSources, setLoadedSources] = useState<Record<string, boolean>>(
    {},
  );

  const [location, setLocation] = useState<Point | null>(null);

  const onLoadDataSource = useCallback(
    (dataSourceId: string, loaded: boolean) => {
      setLoadedSources((sources) => ({ ...sources, [dataSourceId]: loaded }));
    },
    [],
  );

  // Should never happen
  if (!publicMap) {
    return;
  }

  const loadingSources =
    Object.values(loadedSources).filter(Boolean).length < dataSourceIds.length;

  return (
    <div
      className={cn(
        "w-[280px] absolute top-0 left-0 z-10 bg-white flex flex-col",
        hideSidebar ? "h-auto" : "h-full",
      )}
    >
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
            <PublicMapGeocoder onGeocode={(p) => setLocation(p)} />
          </div>
          <div className="overflow-y-auto">
            {/* Listings */}
            {dataSourceIds.map((id) => (
              <DataRecordsList
                key={id}
                dataSourceId={id}
                location={location}
                onLoadingChange={onLoadDataSource}
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
  );
}

function DataRecordsList({
  dataSourceId,
  location,
  onLoadingChange,
}: {
  dataSourceId: string;
  location: Point | null;
  onLoadingChange: (dataSourceId: string, loaded: boolean) => void;
}) {
  const { mapRef, view } = useContext(MapContext);

  const filter = view?.dataSourceViews.find(
    (dsv) => dsv.dataSourceId === dataSourceId,
  )?.filter;

  const sort = location
    ? [{ name: SORT_BY_LOCATION, location, desc: false }]
    : [{ name: SORT_BY_NAME_COLUMNS, desc: false }];

  const dataRecordsQuery = useQuery<
    PublicMapDataRecordsQuery,
    PublicMapDataRecordsQueryVariables
  >(
    gql`
      query PublicMapDataRecords(
        $dataSourceId: String!
        $filter: RecordFilterInput
        $sort: [SortInput!]
      ) {
        dataSource(id: $dataSourceId) {
          id
          name
          columnRoles {
            nameColumns
          }
          records(filter: $filter, sort: $sort, all: true) {
            id
            externalId
            geocodePoint {
              lat
              lng
            }
            json
          }
          recordCount(filter: $filter) {
            count
            matched
          }
        }
      }
    `,
    {
      variables: {
        dataSourceId,
        filter,
        sort,
      },
    },
  );

  useEffect(() => {
    onLoadingChange(dataSourceId, !dataRecordsQuery.loading);
  }, [dataRecordsQuery.loading, dataSourceId, onLoadingChange]);

  if (dataRecordsQuery.loading) {
    return;
  }

  const records = dataRecordsQuery.data?.dataSource?.records || [];

  const getName = (record: {
    externalId: string;
    json: Record<string, unknown>;
  }) => {
    const nameColumns =
      dataRecordsQuery.data?.dataSource?.columnRoles.nameColumns;
    if (!nameColumns?.length) {
      return record.externalId;
    }
    const name = nameColumns
      .map((c) => String(record.json[c]).trim())
      .filter(Boolean)
      .join(" ");
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
