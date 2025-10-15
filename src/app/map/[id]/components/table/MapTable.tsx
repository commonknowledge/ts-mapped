import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/map/[id]/context/TableContext";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import TagButton from "../TagButton";
import { DataTable } from "./DataTable";
import MapTableFilter from "./MapTableFilter";
import TagConfigSidebar from "./TagConfigSidebar";
import TagViewCreationModal from "./TagViewCreationModal";
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
  const { placedMarkers } = useContext(MarkerAndTurfContext);
  const [tagLabel, setTagLabel] = useState("");
  const [isTagCreationModalOpen, setIsTagCreationModalOpen] = useState(false);

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

  const handleCreateTagView = (label: string) => {
    if (!view) return;

    // Create a duplicate view with tag metadata
    const tagView = {
      id: uuidv4(),
      name: label, // Use the provided label as the view name
      config: view.config,
      dataSourceViews: view.dataSourceViews,
      mapId: view.mapId,
      isTag: true,
      createdAt: new Date(),
    };

    console.log("Creating tag view:", tagView);

    try {
      insertView(tagView);
      setTagLabel(label); // Set the tag label for the sidebar
      console.log("insertView called successfully");
    } catch (error) {
      console.error("Error calling insertView:", error);
      toast.error(
        `Failed to create tag view: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleOpenTagCreationModal = () => {
    setIsTagCreationModalOpen(true);
  };

  const handleSendTag = () => {
    tagRecords({ dataSourceId: dataSource.id, viewId: view.id });
  };

  const isTagView = view.isTag === true;

  const syncToCRMButton = (
    <TagButton key="sync-to-crm" onClick={handleOpenTagCreationModal}>
      <span className="capitalize">
        {isTagView
          ? "Duplicate Tag"
          : `Tag records in ${dataSource.config?.type}`}
      </span>
    </TagButton>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {isTagView && (
        <TagConfigSidebar
          tagLabel={tagLabel}
          setTagLabel={setTagLabel}
          dataSource={dataSource}
          dataSourceView={dataSourceView}
          onSendTag={handleSendTag}
          isReadOnly={true}
          placedMarkers={placedMarkers}
          dataRecords={dataRecordsResult?.records || []}
        />
      )}
      <div className="flex-1 min-w-0">
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

      <TagViewCreationModal
        isOpen={isTagCreationModalOpen}
        onClose={() => setIsTagCreationModalOpen(false)}
        onCreateTagView={handleCreateTagView}
        dataSource={dataSource}
        dataSourceView={dataSourceView}
        defaultLabel={`${view?.name || "Untitled"} Tag`}
        placedMarkers={placedMarkers}
        dataRecords={dataRecordsResult?.records || []}
      />
    </div>
  );
}
