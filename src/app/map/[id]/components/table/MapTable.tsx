import { useMutation } from "@tanstack/react-query";
import { useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { DataSourceTypeLabels } from "@/labels";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { DataTable } from "./DataTable";
import MapTableFilter from "./MapTableFilter";
import TagConfigSidebar from "./TagConfigSidebar";
import type { DataSourceView } from "@/server/models/MapView";

interface DataRecord {
  id: string;
  geocodePoint?: { lng: number; lat: number } | null;
}

export default function MapTable() {
  const { mapRef } = useContext(MapContext);
  const { view, updateView, insertView } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { selectedRecord, setSelectedRecord } = useContext(InspectorContext);
  const [tagLabel, setTagLabel] = useState("");
  const [showTable, setShowTable] = useState(true);

  const {
    selectedDataSourceId,
    handleDataSourceSelect,
    tablePage,
    setTablePage,
    dataRecordsResult,
    dataRecordsLoading,
  } = useContext(TableContext);

  // Set tag label to view name by default
  useEffect(() => {
    if (view && !tagLabel) {
      setTagLabel(view.name);
    }
  }, [view, tagLabel]);

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

  const handleCreateTagView = () => {
    if (!view) return;

    // Create a duplicate view with tag metadata
    const tagView = {
      ...view,
      id: uuidv4(),
      name: `${view.name} (Tag)`,
      config: {
        ...view.config,
        isTagView: true,
        tagLabel: tagLabel,
        originalViewId: view.id,
      },
      createdAt: new Date(),
    };

    insertView(tagView);
    toast.success("Created tag view");
  };

  const handleConfigureTag = () => {
    // This will be handled by the map component
  };

  const handleSendTag = () => {
    tagRecords({ dataSourceId: dataSource.id, viewId: view.id });
  };

  const isTagView = (view.config as any).isTagView === true;

  const syncToCRMButton = (
    <Button
      key="sync-to-crm"
      type="button"
      variant="outline"
      onClick={handleCreateTagView}
    >
      {isTagView ? "Duplicate Tag Configuration" : `Tag records in ${DataSourceTypeLabels[dataSource.config.type]}`}
    </Button>
  );

  return (
    <div className="h-full flex">
      {isTagView && (
        <TagConfigSidebar
          tagLabel={tagLabel}
          setTagLabel={setTagLabel}
          dataSource={dataSource}
          dataSourceView={dataSourceView}
          onSendTag={handleSendTag}
        />
      )}
      <div className="flex-1">
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
    </div>
  );
}
