import { useContext } from "react";
import { MapContext } from "../../context/MapContext";
import { DataTable } from "./DataTable";

interface DataRecord {
  id: string;
  geocodePoint?: { lng: number; lat: number } | null;
}

export default function MapTable() {
  const {
    selectedDataSourceId,
    handleDataSourceSelect,
    dataRecordsQuery,
    setSelectedRecordId,
    mapRef,
    selectedRecordId,
  } = useContext(MapContext);

  if (!selectedDataSourceId) {
    return null;
  }

  const dataSource = dataRecordsQuery?.data?.dataSource;
  if (!dataSource) {
    return null;
  }

  const columns = dataSource.columnDefs.map((columnDef) => ({
    header: columnDef.name,
    accessorKey: "json." + columnDef.name,
  }));

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
        columns={columns}
        data={dataSource.records || []}
        onRowClick={handleRowClick}
        selectedRecordId={selectedRecordId || undefined}
        title={dataSource.name}
        recordCount={dataSource.records?.length}
        onClose={() => handleDataSourceSelect("")}
      />
    </div>
  );
}
