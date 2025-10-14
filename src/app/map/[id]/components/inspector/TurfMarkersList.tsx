import { useQueries } from "@tanstack/react-query";

import { useContext, useMemo } from "react";
import { FilterType } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import {
  getMarkersInsideTurf,
  mapPlacedMarkersToRecordsResponse,
} from "./helpers";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";
import type { RecordData, RecordsResponse } from "@/types";

export default function TurfMarkersList() {
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { mapConfig } = useContext(MapContext);
  const { folders, placedMarkers } = useContext(MarkerAndTurfContext);
  const { selectedTurf } = useContext(InspectorContext);

  const trpc = useTRPC();

  const dataSourceIds = mapConfig.getDataSourceIds();

  const { data, isFetching } = useQueries({
    queries: dataSourceIds.map((dataSourceId) =>
      trpc.dataRecord.list.queryOptions(
        {
          dataSourceId,
          filter: { type: FilterType.GEO, turf: selectedTurf?.id },
          page: 0,
        },
        { refetchOnMount: "always" },
      ),
    ),
    combine: (results) => ({
      data: results.map((result, i) => ({
        dataSource: getDataSourceById(dataSourceIds[i]),
        records: (result.data as RecordsResponse) ?? {
          count: { matched: 0 },
          records: [],
        },
      })),
      isFetching: results.some((r) => r.isFetching),
    }),
  });

  const members = useMemo(
    () =>
      data.find(
        (item) => item?.dataSource?.recordType === DataSourceRecordType.Members,
      ),
    [data],
  );

  const markers = useMemo(
    () =>
      data.filter(
        (item) => item?.dataSource?.recordType !== DataSourceRecordType.Members,
      ),
    [data],
  );

  const mappedPlacedMarkers = useMemo(() => {
    const activePlacedMarkers = getMarkersInsideTurf(
      placedMarkers,
      selectedTurf,
    );
    return mapPlacedMarkersToRecordsResponse(activePlacedMarkers, folders);
  }, [folders, placedMarkers, selectedTurf]);

  if (isFetching) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {members && (
        <MembersList
          dataSource={members.dataSource}
          records={members.records}
        />
      )}

      {(markers?.length > 0 || mappedPlacedMarkers.length > 0) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-mono uppercase text-muted-foreground">
            Markers in this area
          </h2>

          {mappedPlacedMarkers.length > 0 &&
            mappedPlacedMarkers.map((markersGroup, index) => (
              <PlacedMarkersList
                key={index}
                folder={markersGroup.folder}
                records={markersGroup.records}
              ></PlacedMarkersList>
            ))}

          {markers?.length > 0 &&
            markers.map((markersGroup, index) => (
              <MarkersList
                key={index}
                dataSource={markersGroup.dataSource}
                records={markersGroup.records}
              ></MarkersList>
            ))}
        </div>
      )}
    </div>
  );
}

const MembersList = ({
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
        <>
          <ul className="flex flex-col gap-1">
            {memberRecords.map((record) => {
              const displayName = nameColumn
                ? String(record.json[nameColumn] ?? "")
                : `Id: ${record.id}`;
              return (
                <li key={record.id}>
                  <button
                    className="cursor-pointer text-left"
                    onClick={() => onRecordClick(record)}
                  >
                    {displayName}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p>No members in this area.</p>
      )}
    </div>
  );
};

const MarkersList = ({
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

  if (recordsList.length === 0) {
    return <></>;
  }

  const onRecordClick = (record: RecordData) => {
    setSelectedRecord({
      id: record.id,
      dataSourceId: dataSource?.id as string,
      properties: {
        ...record.json,
        __name: nameColumn ? record.json[nameColumn] : "",
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">
        {dataSource?.name} {total > 0 && <>({total})</>}
      </h3>

      <ul className="flex flex-col gap-1">
        {recordsList.map((record) => {
          const displayName = nameColumn
            ? String(record.json[nameColumn] ?? "")
            : `Id: ${record.id}`;
          return (
            <li key={record.id}>
              <button
                className="cursor-pointer text-left"
                onClick={() => onRecordClick(record)}
              >
                {displayName}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const PlacedMarkersList = ({
  folder,
  records,
}: {
  folder: Folder | null;
  records: RecordsResponse;
}) => {
  const { setSelectedRecord } = useContext(InspectorContext);

  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;
  const name = folder?.name;

  if (recordsList.length === 0) {
    return <></>;
  }

  const onRecordClick = (record: RecordData) => {
    setSelectedRecord({
      id: record.id,
      dataSourceId: "",
      properties: {
        __name: record.json?.name || "",
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {name && (
        <h3 className="font-semibold">
          {name} ({total})
        </h3>
      )}

      <ul className="flex flex-col gap-1">
        {recordsList.map((record) => {
          return (
            <li key={record.id}>
              <button
                className="cursor-pointer text-left"
                onClick={() => onRecordClick(record)}
              >
                {record.json?.name as string}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
