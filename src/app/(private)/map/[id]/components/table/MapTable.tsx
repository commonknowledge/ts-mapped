import { useContext } from "react";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { DataTable } from "./DataTable";

interface DataRecord {
  id: string;
  geocodePoint?: { lng: number; lat: number } | null;
}

export default function MapTable() {
  const { mapRef, dataSourcesQuery } = useContext(MapContext);
  const {
    selectedDataSourceId,
    handleDataSourceSelect,
    selectedRecordId,
    setSelectedRecordId,
    tableFilter,
    setTableFilter,
    tablePage,
    setTablePage,
    tableSort,
    setTableSort,
    dataRecordsQuery,
  } = useContext(TableContext);

  if (!selectedDataSourceId) {
    return null;
  }

  const dataSource = dataSourcesQuery?.data?.dataSources?.find(
    (ds) => ds.id === selectedDataSourceId,
  );
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

  return (
    <div className="p-2 h-full">
      <DataTable
        title={dataSource.name}
        loading={dataRecordsQuery ? dataRecordsQuery.loading : true}
        columns={dataSource.columnDefs}
        data={dataRecordsQuery?.data?.dataSource?.records || []}
        recordCount={dataRecordsQuery?.data?.dataSource?.recordCount}
        filter={tableFilter}
        setFilter={setTableFilter}
        pageIndex={tablePage}
        setPageIndex={setTablePage}
        sort={tableSort}
        setSort={setTableSort}
        onRowClick={handleRowClick}
        selectedRecordId={selectedRecordId || undefined}
        onClose={() => handleDataSourceSelect("")}
      />
    </div>
  );
}
