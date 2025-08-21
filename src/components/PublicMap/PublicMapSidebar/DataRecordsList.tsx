"use client";

import { QueryResult } from "@apollo/client";
import { useContext } from "react";
import {
  PublicMapDataRecordsQuery,
  PublicMapDataRecordsQueryVariables,
} from "@/__generated__/types";
import { MapContext } from "@/components/Map/context/MapContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { buildName } from "./utils";

interface DataRecordsListProps {
  dataRecordsQuery: QueryResult<
    PublicMapDataRecordsQuery,
    PublicMapDataRecordsQueryVariables
  >;
  onSelect: (r: { id: string; dataSourceId: string }) => void;
  colourScheme: { primary: string; muted: string };
}

export default function DataRecordsList({
  dataRecordsQuery,
  onSelect,
  colourScheme,
}: DataRecordsListProps) {
  const { publicMap } = useContext(PublicMapContext);
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
      <ul className="flex flex-col px-2">
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colourScheme.primary }}
                />
                <span className="font-medium">{getName(r)}</span>
              </div>
              {getDescription(r) && (
                <span className="text-sm ml-[1.1rem]">{getDescription(r)}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
