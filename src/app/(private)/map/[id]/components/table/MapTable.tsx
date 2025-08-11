import { useContext } from "react";
import { DataSourceView, FilterType } from "@/__generated__/types";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { Input } from "@/shadcn/ui/input";
import { DataTable } from "./DataTable";
import MapTableFilter from "./MapTableFilter";

interface DataRecord {
  id: string;
  geocodePoint?: { lng: number; lat: number } | null;
}

export default function MapTable() {
  const { mapRef, view, updateView } = useContext(MapContext);
  const { getDataSourceById } = useContext(DataSourcesContext);

  const {
    selectedDataSourceId,
    handleDataSourceSelect,
    selectedRecordId,
    setSelectedRecordId,
    tablePage,
    setTablePage,
    dataRecordsQuery,
  } = useContext(TableContext);

  if (!selectedDataSourceId) {
    return null;
  }

  const dataSource = getDataSourceById(selectedDataSourceId);

  if (!dataSource) {
    return null;
  }

  const handleRowClick = (row: DataRecord) => {
    if (!row.geocodePoint) return;
    mapRef?.current?.flyTo({
      center: [row.geocodePoint.lng, row.geocodePoint.lat],
      zoom: 15,
    });
    setSelectedRecordId(row.id);
  };

  const dataSourceView = view?.dataSourceViews.find(
    (dsv) => dsv.dataSourceId === dataSource.id
  );
  const updateDataSourceView = (update: Partial<DataSourceView>) => {
    if (view) {
      let dataSourceViews = view.dataSourceViews;
      if (dataSourceView) {
        dataSourceViews = view.dataSourceViews.map((dsv) => {
          if (dsv.dataSourceId === dataSource.id) {
            return { ...dsv, ...update };
          }
          return dsv;
        });
      } else {
        dataSourceViews = [
          ...dataSourceViews,
          {
            dataSourceId: dataSource.id,
            filter: { type: FilterType.MULTI },
            search: "",
            sort: [],
            ...update,
          },
        ];
      }
      updateView({ ...view, dataSourceViews });
    }
  };

  const filter = (
    <MapTableFilter
      filter={dataSourceView?.filter || { type: FilterType.MULTI }}
      setFilter={(filter) => updateDataSourceView({ filter })}
    />
  );

  const search = (
    <Input
      type="text"
      placeholder="Search"
      value={dataSourceView?.search || ""}
      onChange={(e) => updateDataSourceView({ search: e.target.value })}
    />
  );

  return (
    <div className="h-full">
      <DataTable
        title={dataSource.name}
        loading={dataRecordsQuery ? dataRecordsQuery.loading : true}
        columns={dataSource.columnDefs}
        data={dataRecordsQuery?.data?.dataSource?.records || []}
        recordCount={dataRecordsQuery?.data?.dataSource?.recordCount}
        filter={filter}
        search={search}
        pageIndex={tablePage}
        setPageIndex={setTablePage}
        sort={dataSourceView?.sort || []}
        setSort={(sort) => updateDataSourceView({ sort })}
        onRowClick={handleRowClick}
        selectedRecordId={selectedRecordId || undefined}
        onClose={() => handleDataSourceSelect("")}
      />
    </div>
  );
}
