import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";

import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useDataRecords } from "@/app/map/[id]/hooks/useDataRecords";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import { useFeatureFlagEnabled } from "@/hooks";
import { DataSourceTypeLabels } from "@/labels";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { buildName } from "@/utils/dataRecord";
import { DataTable } from "./DataTable";
import MapTableFilter from "./MapTableFilter";
import type { DataSourceView } from "@/server/models/MapView";

interface DataRecord {
  id: string;
  externalId: string;
  geocodePoint?: { lng: number; lat: number } | null;
  json: Record<string, unknown>;
}

export default function MapTable() {
  const { mapRef } = useContext(MapContext);
  const { view, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { focusedRecord, setFocusedRecord } = useInspector();
  const enableSyncToCRM = useFeatureFlagEnabled("sync-to-crm");
  const [lookingUpPage, setLookingUpPage] = useState(false);

  const {
    selectedDataSourceId,
    handleDataSourceSelect,
    tablePage,
    setTablePage,
  } = useTable();

  const dataSourceView = view?.dataSourceViews.find(
    (dsv) => dsv.dataSourceId === selectedDataSourceId,
  );

  const { data: dataRecordsResult, isFetching: dataRecordsLoading } =
    useDataRecords(selectedDataSourceId, tablePage);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

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

  // Skip to the correct page when the selected record changes
  // Use two effects: one to mark a lookup as required, and one to do it
  // This prevents other state changes from re-triggering the lookup
  // Open to other solutions to this, double useEffect doesn't feel right
  useEffect(() => {
    if (selectedDataSourceId && focusedRecord) {
      setLookingUpPage(true);
    }
  }, [focusedRecord, selectedDataSourceId]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!lookingUpPage) {
        return;
      }

      if (dataRecordsLoading) {
        // Don't clear loading state here to avoid flicker
        return;
      }

      if (!focusedRecord) {
        return;
      }

      if (!selectedDataSourceId || !focusedRecord?.id) {
        setLookingUpPage(false);
        return;
      }

      const recordInCurrentPage = dataRecordsResult?.records.some(
        (r) => r.id === focusedRecord.id,
      );

      if (recordInCurrentPage) {
        setLookingUpPage(false);
        return;
      }

      try {
        const pageIndex = await queryClient.fetchQuery(
          trpc.dataRecord.findPageIndex.queryOptions({
            dataSourceId: selectedDataSourceId,
            dataRecordId: focusedRecord.id,
            search: dataSourceView?.search,
            filter: dataSourceView?.filter,
            sort: dataSourceView?.sort,
          }),
        );

        if (pageIndex !== null && pageIndex !== tablePage) {
          setTablePage(pageIndex);
        }
      } catch (error) {
        console.error("Failed to fetch page:", error);
      }

      setLookingUpPage(false);
    };

    fetchPage();
  }, [
    dataRecordsLoading,
    dataRecordsResult?.records,
    dataSourceView,
    focusedRecord,
    lookingUpPage,
    queryClient,
    selectedDataSourceId,
    setTablePage,
    tablePage,
    trpc.dataRecord.findPageIndex,
    view,
  ]);

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
    setFocusedRecord({
      id: row.id,
      dataSourceId: dataSource.id,
      name: buildName(dataSource, row),
      geocodePoint: row.geocodePoint,
    });
  };

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

  const syncToCRMButton = enableSyncToCRM ? (
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
  ) : null;

  return (
    <div className="h-full">
      <DataTable
        title={dataSource.name}
        buttons={[syncToCRMButton]}
        loading={dataRecordsLoading || lookingUpPage}
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
        selectedRecordId={focusedRecord?.id}
        onClose={() => handleDataSourceSelect("")}
      />
    </div>
  );
}
