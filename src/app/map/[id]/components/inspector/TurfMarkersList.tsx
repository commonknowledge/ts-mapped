import { useQueries } from "@tanstack/react-query";
import { useContext, useMemo } from "react";
import { FilterType } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";

interface RecordData {
  id: string;
  json: Record<string, unknown>;
}

interface RecordsResponse {
  count: { matched: number };
  records: RecordData[];
}

export default function TurfMarkersList() {
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { mapConfig } = useContext(MapContext);
  const { selectedTurf } = useContext(InspectorContext);

  const trpc = useTRPC();

  const dataSourceIds = mapConfig.getDataSourceIds();

  const { data, isFetching } = useQueries({
    queries: dataSourceIds.map((dataSourceId) =>
      trpc.dataRecord.list.queryOptions(
        {
          dataSourceId,
          filter: { type: FilterType.GEO, turf: selectedTurf?.id },
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

  const nameColumn = members?.dataSource?.columnRoles?.nameColumns?.[0];
  const memberRecords = members?.records.records ?? [];
  const total = members?.records.count.matched ?? 0;

  if (isFetching) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono uppercase text-muted-foreground">
        Members in this area {total > 0 && <>({total})</>}
      </h3>

      {!members ? (
        <p>No member data source found.</p>
      ) : memberRecords.length > 0 ? (
        <>
          <ul className="flex flex-col gap-1">
            {memberRecords.map((record) => {
              const displayName = nameColumn
                ? String(record.json[nameColumn] ?? "")
                : `Id: ${record.id}`;
              return <li key={record.id}>{displayName}</li>;
            })}
          </ul>
        </>
      ) : (
        <p>No members in this area.</p>
      )}
    </div>
  );
}
