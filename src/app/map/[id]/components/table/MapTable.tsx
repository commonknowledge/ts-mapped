import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import { toast } from "sonner";
import { FilterType } from "@/__generated__/types";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { DataSourceTypeLabels } from "@/labels";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { DataTable } from "./DataTable";
import MapTableFilter from "./MapTableFilter";
import type { DataSourceView } from "@/__generated__/types";

interface DataRecord {
  id: string;
  geocodePoint?: { lng: number; lat: number } | null;
}

export default function MapTable() {
  const { mapRef, view, updateView } = useContext(MapContext);
  const { getDataSourceById } = useDataSources();
  const { selectedRecord, setSelectedRecord } = useContext(InspectorContext);

  const {
    selectedDataSourceId,
    handleDataSourceSelect,
    tablePage,
    setTablePage,
    dataRecordsResult,
    dataRecordsLoading,
  } = useContext(TableContext);

  const trpc = useTRPC();
  const { mutate: tagRecords } = useMutation(
    trpc.mapView.tagRecordsWithViewName.mutationOptions({
      onSuccess: () => {
        toast.success("Tagging records in the background");
      },
      onError: () => {
        toast.error("Failed to tag records with view name");
      },
    }),
  );

  if (!selectedDataSourceId || !view) {
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
    setSelectedRecord({ id: row.id, dataSourceId: dataSource.id });
  };

  const dataSourceView = view.dataSourceViews.find(
    (dsv) => dsv.dataSourceId === dataSource.id,
  );
  const updateDataSourceView = (update: Partial<DataSourceView>) => {
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
  };

  const filter = (
    <MapTableFilter
      filter={dataSourceView?.filter || { type: FilterType.MULTI }}
      setFilter={(filter) => {
        setTablePage(0);
        updateDataSourceView({ filter });
      }}
    />
  );

  const syncToCRMButton = (
    <Button
      key="sync-to-crm"
      type="button"
      variant="outline"
      onClick={() =>
        tagRecords({ dataSourceId: dataSource.id, viewId: view.id })
      }
    >
      Tag records in {DataSourceTypeLabels[dataSource.config.type]}
    </Button>
  );

  return (
    <div className="h-full">
      <DataTable
        title={dataSource.name}
        buttons={[syncToCRMButton]}
        loading={dataRecordsLoading}
        columns={dataSource.columnDefs}
        data={dataRecordsResult?.records || []}
        recordCount={dataRecordsResult?.count}
        filter={filter}
        search={dataSourceView?.search}
        setSearch={(s) => updateDataSourceView({ search: s })}
        pageIndex={tablePage}
        setPageIndex={setTablePage}
        sort={dataSourceView?.sort || []}
        setSort={(sort) => updateDataSourceView({ sort })}
        onRowClick={handleRowClick}
        selectedRecordId={selectedRecord?.id}
        onClose={() => handleDataSourceSelect("")}
      />
    </div>
  );
}
