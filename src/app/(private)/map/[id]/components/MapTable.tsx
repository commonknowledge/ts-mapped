import { useContext } from "react";
import { MapContext } from "../context/MapContext";

export default function MapTable() {
  const { selectedDataSourceId, dataRecordsQuery } = useContext(MapContext);

  if (!selectedDataSourceId) {
    return null;
  }

  const dataSource = dataRecordsQuery?.data?.dataSource;
  if (!dataSource) {
    return null;
  }

  return (
    <>
    <div className="flex flex-col gap-4">
      <h2 className="font-bold">Column Defs</h2>
      {dataSource?.columnDefs.map((columnDef) => (
    <p key={columnDef.name}>
      {columnDef.name}: {columnDef.type}
    </p>
  ))}
</div>
<div>
  <h2 className="font-bold">Data</h2>
  {dataRecordsQuery.data?.dataSource?.records?.map((r) => (
    <p key={r.id}>{JSON.stringify(r.json)}</p>
        ))}
      </div>
    
    </>
  )
}