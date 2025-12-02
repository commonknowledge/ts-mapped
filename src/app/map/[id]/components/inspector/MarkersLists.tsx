import { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { MARKER_NAME_KEY } from "@/constants";
import { LayerType, type RecordData, type RecordsResponse } from "@/types";
import { buildName } from "@/utils/dataRecord";
import TurfMarkerButton from "./TurfMarkerButton";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";

export const MembersList = ({
  records,
  dataSource,
}: {
  records: RecordsResponse;
  dataSource: DataSource | null;
}) => {
  const { setSelectedRecords } = useContext(InspectorContext);

  const memberRecords = records.records ?? [];
  const total = records.count.matched ?? 0;

  const onRecordClick = (record: RecordData) => {
    setSelectedRecords([
      {
        id: record.id,
        dataSourceId: dataSource?.id as string,
        point: record.geocodePoint,
        properties: {
          ...record.json,
          [MARKER_NAME_KEY]: buildName(dataSource, {
            ...record,
            // The externalId is not present as this data comes from the marker GeoJSON
            // TODO: Refactor the inspector to not use marker GeoJSON data (so it can be reduced in size),
            // but to load data when needed from the backend
            externalId: "Unknown",
          }),
        },
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-mono uppercase text-muted-foreground">
        Members in this area {total > 0 && <>({total})</>}
      </h2>

      {!dataSource ? (
        <p>No members data source found.</p>
      ) : memberRecords.length > 0 ? (
        <ul>
          {memberRecords.map((record) => {
            const displayName = buildName(dataSource, {
              ...record,
              // The externalId is not present as this data comes from the marker GeoJSON
              // TODO: Refactor the inspector to not use marker GeoJSON data (so it can be reduced in size),
              // but to load data when needed from the backend
              externalId: "Unknown",
            });
            return (
              <li key={record.id}>
                <TurfMarkerButton
                  label={displayName}
                  type={LayerType.Member}
                  onClick={() => onRecordClick(record)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No members in this area.</p>
      )}
    </div>
  );
};

export const MarkersList = ({
  records,
  dataSource,
}: {
  records: RecordsResponse;
  dataSource: DataSource | null;
}) => {
  const { setSelectedRecords } = useContext(InspectorContext);

  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;

  const onRecordClick = (record: RecordData) => {
    setSelectedRecords([
      {
        id: record.id,
        dataSourceId: dataSource?.id as string,
        point: record.geocodePoint,
        properties: {
          ...record.json,
          [MARKER_NAME_KEY]: buildName(dataSource, {
            ...record,
            // The externalId is not present as this data comes from the marker GeoJSON
            // TODO: Refactor the inspector to not use marker GeoJSON data (so it can be reduced in size),
            // but to load data when needed from the backend
            externalId: "Unknown",
          }),
        },
      },
    ]);
  };

  if (recordsList.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-semibold">
        <div className="shrink-0">
          <DataSourceIcon type={dataSource?.config.type}></DataSourceIcon>
        </div>
        {dataSource?.name} {total > 0 && <>({total})</>}
      </h3>

      <ul>
        {recordsList.map((record) => {
          return (
            <li key={record.id}>
              <TurfMarkerButton
                label={buildName(dataSource, {
                  ...record,
                  // The externalId is not present as this data comes from the marker GeoJSON
                  // TODO: Refactor the inspector to not use marker GeoJSON data (so it can be reduced in size),
                  // but to load data when needed from the backend
                  externalId: "Unknown",
                })}
                type={LayerType.Marker}
                onClick={() => onRecordClick(record)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const PlacedMarkersList = ({
  folder,
  records,
}: {
  folder: Folder | null;
  records: RecordsResponse;
}) => {
  const { setSelectedRecords } = useContext(InspectorContext);

  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;
  const name = folder?.name || "No folder";

  const onRecordClick = (record: RecordData) => {
    setSelectedRecords([
      {
        id: record.id,
        dataSourceId: "",
        point: record.geocodePoint,
        properties: {
          [MARKER_NAME_KEY]: record.json?.name || "",
        },
      },
    ]);
  };

  if (recordsList.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">
        {name} ({total})
      </h3>

      <ul>
        {recordsList.map((record) => {
          return (
            <li key={record.id}>
              <TurfMarkerButton
                label={record.json?.name as string}
                type={LayerType.Marker}
                onClick={() => onRecordClick(record)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
