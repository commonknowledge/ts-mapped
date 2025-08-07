import { useContext } from "react";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import { Input } from "@/shadcn/ui/input";
import { DataTable } from "./DataTable";
import TableFilter from "./TableFilter";

interface DataRecord {
  id: string;
  geocodePoint?: { lng: number; lat: number } | null;
}

export default function MapTable() {
  const { mapRef } = useContext(MapContext);
  const { getDataSourceById } = useContext(DataSourcesContext);

  const {
    selectedDataSourceId,
    handleDataSourceSelect,
    selectedRecordId,
    setSelectedRecordId,
    tableFilter,
    setTableFilter,
    tableSearch,
    setTableSearch,
    tablePage,
    setTablePage,
    tableSort,
    setTableSort,
    dataRecordsQuery,
  } = useContext(TableContext);
  const { placedMarkers, turfs } = useContext(MarkerAndTurfContext);

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

  const filter = (
    <TableFilter
      filter={tableFilter}
      setFilter={setTableFilter}
      columns={dataSource.columnDefs}
      placedMarkers={placedMarkers}
      turfs={turfs}
    />
  );

  const search = (
    <Input
      type="text"
      placeholder="Search"
      value={tableSearch}
      onChange={(e) => setTableSearch(e.target.value)}
    />
  );

  return (
    <div className="p-2 h-full">
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
        sort={tableSort}
        setSort={setTableSort}
        onRowClick={handleRowClick}
        selectedRecordId={selectedRecordId || undefined}
        onClose={() => handleDataSourceSelect("")}
      />
    </div>
  );
}
