import { useQueries } from "@tanstack/react-query";
import { TableIcon } from "lucide-react";
import { useContext, useMemo } from "react";
import { FilterType } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/map/[id]/context/DataSourcesContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { DataSourceRecordType } from "@/server/models/DataSource";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import type { DataSourceView } from "@/__generated__/types";

const MAX_RECORDS = 8;

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
  const { mapConfig, view, updateView } = useContext(MapContext);
  const { selectedTurf } = useContext(InspectorContext);
  const { handleDataSourceSelect } = useContext(TableContext);

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

  const updateDataSourceView = (
    update: Partial<DataSourceView>,
    dataSourceId: string,
  ) => {
    if (!view || !dataSourceId) {
      return;
    }

    const dataSourceView = view.dataSourceViews.find(
      (dsv) => dsv.dataSourceId === dataSourceId,
    );

    let dataSourceViews = view.dataSourceViews;

    if (dataSourceView) {
      dataSourceViews = view.dataSourceViews.map((dsv) => {
        if (dsv.dataSourceId === dataSourceId) {
          return { ...dsv, ...update };
        }
        return dsv;
      });
    } else {
      dataSourceViews = [
        ...dataSourceViews,
        {
          dataSourceId: dataSourceId,
          filter: { type: FilterType.MULTI },
          search: "",
          sort: [],
          ...update,
        },
      ];
    }
    updateView({ ...view, dataSourceViews });
  };

  const dataSourceId = members?.dataSource?.id;
  const nameColumn = members?.dataSource?.columnRoles?.nameColumns?.[0];
  const memberRecords = members?.records.records ?? [];
  const total = members?.records.count.matched ?? 0;
  const showMore = total > MAX_RECORDS;

  const onShowAll = (dataSourceId: string | undefined) => {
    if (dataSourceId) {
      handleDataSourceSelect(dataSourceId);

      setTimeout(() => {
        updateDataSourceView(
          { filter: { type: FilterType.GEO, turf: selectedTurf?.id } },
          dataSourceId,
        );
      }, 300);
    }
  };

  if (isFetching) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono uppercase text-muted-foreground">
        Members in this area
      </h3>

      {!members ? (
        <p>No member data source found.</p>
      ) : memberRecords.length > 0 ? (
        <>
          <ul className="flex flex-col gap-1">
            {memberRecords.slice(0, MAX_RECORDS).map((record) => {
              const displayName = nameColumn
                ? String(record.json[nameColumn] ?? "")
                : `Id: ${record.id}`;
              return <li key={record.id}>{displayName}</li>;
            })}
          </ul>
          {showMore && (
            <Button
              variant="secondary"
              className="mt-1"
              onClick={() => onShowAll(dataSourceId)}
            >
              <TableIcon />
              See all records ({total})
            </Button>
          )}
        </>
      ) : (
        <p>No members in this area.</p>
      )}
    </div>
  );
}
