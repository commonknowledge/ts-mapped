import { useQueries } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { getDataSourceIds } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import DataSourceIcon from "@/components/DataSourceIcon";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { LayerType, type RecordData, type RecordsResponse } from "@/types";
import {
  checkIfAnyRecords,
  getMarkersInsideTurf,
  mapPlacedMarkersToRecordsResponse,
} from "./helpers";
import TurfMarkerButton from "./TurfMarkerButton";
import type { DataSource } from "@/server/models/DataSource";
import type { Folder } from "@/server/models/Folder";

export default function TurfMarkersList() {
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { folders, placedMarkers } = useContext(MarkerAndTurfContext);
  const { selectedTurf } = useContext(InspectorContext);
  const trpc = useTRPC();

  const dataSourceIds = getDataSourceIds(mapConfig);

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

          {!checkIfAnyRecords([...mappedPlacedMarkers, ...markers]) && (
            <p>No markers in this area</p>
          )}

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
