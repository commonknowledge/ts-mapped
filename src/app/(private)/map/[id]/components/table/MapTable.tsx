import { useContext } from "react";
import { MapContext } from "../../context/MapContext";
import { DataTable } from "./DataTable";

export default function MapTable() {
  const { selectedDataSourceId, dataRecordsQuery, setSelectedRecordId, mapRef } = useContext(MapContext);

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

  const handleRowClick = (row: any) => {
    mapRef?.current?.flyTo({
      center: [row.geocodePoint.lng, row.geocodePoint.lat],
      zoom: 15,
    });
  };

  return (
    <>
    <div className="flex flex-row gap-4 p-4 border-b border-gray-200">
    <p className="font-bold">{dataSource.name}</p>
    <p>{dataSource.records?.length}</p>
    </div>
    <div className="p-2 bg-neutral-100 h-full">
      <DataTable columns={columns} data={dataSource.records || []} onRowClick={handleRowClick} />
    </div>
 </>
  )
}