import { useContext } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import DataSourceIcon from "@/components/DataSourceIcon";
import { LayerType, type RecordData, type RecordsResponse } from "@/types";
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
  const { setSelectedRecord } = useContext(InspectorContext);

  const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
  const memberRecords = records.records ?? [];
  const total = records.count.matched ?? 0;

  const onRecordClick = (record: RecordData) => {
    setSelectedRecord({
      id: record.id,
      dataSourceId: dataSource?.id as string,
      point: record.geocodePoint,
      properties: {
        ...record.json,
        __name: nameColumn ? record.json[nameColumn] : "",
      },
    });
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
            const displayName = nameColumn
              ? String(record.json[nameColumn] ?? "")
              : `Id: ${record.id}`;
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
  const { setSelectedRecord } = useContext(InspectorContext);

  const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;

  const onRecordClick = (record: RecordData) => {
    setSelectedRecord({
      id: record.id,
      dataSourceId: dataSource?.id as string,
      point: record.geocodePoint,
      properties: {
        ...record.json,
        __name: nameColumn ? record.json[nameColumn] : "",
      },
    });
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
          const displayName = nameColumn
            ? String(record.json[nameColumn] ?? "")
            : `Id: ${record.id}`;
          return (
            <li key={record.id}>
              <TurfMarkerButton
                label={displayName}
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
  const { setSelectedRecord } = useContext(InspectorContext);

  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;
  const name = folder?.name || "No folder";

  const onRecordClick = (record: RecordData) => {
    setSelectedRecord({
      id: record.id,
      dataSourceId: "",
      point: record.geocodePoint,
      properties: {
        __name: record.json?.name || "",
      },
    });
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
