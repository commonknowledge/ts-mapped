"use client";

import { gql, useQuery } from "@apollo/client";
import { LoaderPinwheel, PanelLeft } from "lucide-react";
import { useContext } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
} from "@/__generated__/types";
import Sidebar from "@/components/Map/components/Sidebar";
import { MapContext } from "@/components/Map/context/MapContext";
import { SORT_BY_NAME_COLUMNS } from "@/constants";
import { Button } from "@/shadcn/ui/button";
import { PublicMapContext } from "./PublicMapContext";

export default function PublicMapSidebar({
  showControls,
  setShowControls,
}: {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}) {
  const { publicMap } = useContext(PublicMapContext);
  const { mapConfig } = useContext(MapContext);

  // Should never happen
  if (!publicMap) {
    return;
  }

  const dataSourceIds = [mapConfig.membersDataSourceId]
    .concat(mapConfig.markerDataSourceIds)
    .filter(Boolean);

  return (
    <Sidebar setShowControls={setShowControls} showControls={showControls}>
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-neutral-200 pl-4 pt-1 pr-1 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">{publicMap.name}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowControls(!showControls)}
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
      {/* Listings */}
      {dataSourceIds.map((id) => (
        <DataRecordsList key={id} dataSourceId={id} />
      ))}
    </Sidebar>
  );
}

function DataRecordsList({ dataSourceId }: { dataSourceId: string }) {
  const { mapRef, view } = useContext(MapContext);

  const filter = view?.dataSourceViews.find(
    (dsv) => dsv.dataSourceId === dataSourceId,
  )?.filter;

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
        sort: [{ name: SORT_BY_NAME_COLUMNS, desc: false }],
      },
    },
  );

  if (dataRecordsQuery.loading) {
    return (
      <div className="p-4">
        <LoaderPinwheel className="animate-spin" />
      </div>
    );
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
    <div className="flex flex-col py-4 gap-2">
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
