import { useQueries } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useContext, useMemo } from "react";
import { FilterType } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import type { SelectedTurf } from "@/app/map/[id]/context/InspectorContext";
import type { DataSource } from "@/server/models/DataSource";
import type { PlacedMarker } from "@/server/models/PlacedMarker";

interface RecordData {
  id: string;
  json: Record<string, unknown>;
}

interface RecordsResponse {
  count: { matched: number };
  records: RecordData[];
}

function getMarkersInsideTurf(
  markers: PlacedMarker[],
  selectedTurf: SelectedTurf | null,
) {
  if (!selectedTurf) {
    return [];
  }

  const turfPolygon = turf.polygon(selectedTurf.geometry.coordinates);

  return markers.filter((marker) => {
    const point = turf.point([marker.point.lng, marker.point.lat]);
    return turf.booleanPointInPolygon(point, turfPolygon);
  });
}

export default function TurfMarkersList() {
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { mapConfig } = useContext(MapContext);
  const { placedMarkers } = useContext(MarkerAndTurfContext);
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

  const activePlacedMarkers = useMemo(
    () => getMarkersInsideTurf(placedMarkers, selectedTurf),
    [placedMarkers, selectedTurf],
  );

  console.log("MARKERS", activePlacedMarkers);

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

      {markers?.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-mono uppercase text-muted-foreground">
            Markers in this area
          </h3>
          {markers.map((markersGroup, index) => (
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
      properties: {}, // TODO: get marker properties
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono uppercase text-muted-foreground">
        Members in this area {total > 0 && <>({total})</>}
      </h3>

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
                    className="cursor-pointer"
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
  const nameColumn = dataSource?.columnRoles?.nameColumns?.[0];
  const recordsList = records.records ?? [];
  const total = records.count.matched ?? 0;

  if (recordsList.length === 0) {
    return <></>;
  }

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
          return <li key={record.id}>{displayName}</li>;
        })}
      </ul>
    </div>
  );
};
