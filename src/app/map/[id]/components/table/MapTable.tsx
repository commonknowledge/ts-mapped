import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useDataRecords } from "@/app/map/[id]/hooks/useDataRecords";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useInspector } from "@/app/map/[id]/hooks/useInspector";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import { DataSourceFeatures } from "@/features";
import { useFeatureFlagEnabled } from "@/hooks";
import { DataSourceTypeLabels } from "@/labels";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { ColumnType } from "@/server/models/DataSource";
import { FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { buildName } from "@/utils/dataRecord";
import { useMapId, useMapRef } from "../../hooks/useMapCore";
import { useMapQuery } from "../../hooks/useMapQuery";
import { DataTable } from "./DataTable";
import MapTableFilter from "./MapTableFilter";
import SyncToCrmModal from "./SyncToCrmModal";
import type { DataSourceView } from "@/server/models/MapView";

interface DataRecord {
  id: string;
  externalId: string;
  geocodePoint?: { lng: number; lat: number } | null;
  json: Record<string, unknown>;
}

const PENDING_TAG_KEY = "mapped:pendingTagColumn";

interface PendingTag {
  dataSourceId: string;
  columnName: string;
  matchedRecordIds: string[];
}

function getPendingTag(dataSourceId: string): PendingTag | null {
  try {
    const raw = localStorage.getItem(PENDING_TAG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingTag;
    return parsed.dataSourceId === dataSourceId ? parsed : null;
  } catch {
    return null;
  }
}

function setPendingTag(tag: PendingTag) {
  localStorage.setItem(PENDING_TAG_KEY, JSON.stringify(tag));
}

function clearPendingTag() {
  localStorage.removeItem(PENDING_TAG_KEY);
}

export default function MapTable() {
  const mapRef = useMapRef();
  const mapId = useMapId();
  const { data: map } = useMapQuery(mapId);
  const { view, updateView } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { focusedRecord, setFocusedRecord } = useInspector();
  const [lookingUpPage, setLookingUpPage] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [pendingTagColumnName, setPendingTagColumnName] = useState<
    string | null
  >(null);
  const [matchedRecordIds, setMatchedRecordIds] = useState<Set<string>>(
    new Set(),
  );

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
        toast.success(
          "Tagging records in the background - we will email you when the process completes.",
        );
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

  const dataSource = getDataSourceById(selectedDataSourceId);

  const { organisationId } = useContext(OrganisationsContext);
  const isOwner = Boolean(
    organisationId &&
    dataSource &&
    dataSource.organisationId === organisationId,
  );

  const enableSyncToCRM =
    useFeatureFlagEnabled("sync-to-crm") &&
    isOwner &&
    dataSource &&
    DataSourceFeatures[dataSource.config.type].syncToCrm;

  useEffect(() => {
    if (!selectedDataSourceId) return;
    const stored = getPendingTag(selectedDataSourceId);
    if (!stored) {
      setPendingTagColumnName(null);
      setMatchedRecordIds(new Set());
      return;
    }
    const realColumnExists = dataSource?.columnDefs.some(
      (c) => c.name === stored.columnName,
    );
    if (realColumnExists) {
      clearPendingTag();
      setPendingTagColumnName(null);
      setMatchedRecordIds(new Set());
    } else {
      setPendingTagColumnName(stored.columnName);
      setMatchedRecordIds(new Set(stored.matchedRecordIds));
    }
  }, [selectedDataSourceId, dataSource?.columnDefs]);

  const pendingTagDisplayName = pendingTagColumnName
    ? `${pendingTagColumnName} (Syncing...)`
    : null;

  const columnsWithTag = useMemo(() => {
    const cols = [...(dataSource?.columnDefs || [])];
    if (pendingTagDisplayName) {
      cols.push({ name: pendingTagDisplayName, type: ColumnType.Boolean });
    }
    return cols.toSorted((a, b) => {
      const aIsMapped = a.name.startsWith("Mapped");
      const bIsMapped = b.name.startsWith("Mapped");
      if (aIsMapped === bIsMapped) return 0;
      return aIsMapped ? 1 : -1;
    });
  }, [dataSource?.columnDefs, pendingTagDisplayName]);

  const dataWithTag = useMemo(() => {
    const records = dataRecordsResult?.records || [];
    if (!pendingTagDisplayName) return records;
    return records.map((record) => ({
      ...record,
      json: {
        ...record.json,
        [pendingTagDisplayName]: matchedRecordIds.has(record.id)
          ? true
          : undefined,
      },
    }));
  }, [dataRecordsResult?.records, pendingTagDisplayName, matchedRecordIds]);

  const highlightedColumns = useMemo(
    () =>
      pendingTagDisplayName ? new Set([pendingTagDisplayName]) : undefined,
    [pendingTagDisplayName],
  );

  if (!dataSource || !view) {
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
      search={dataSourceView?.search}
      setSearch={(s) => updateDataSourceView({ search: s })}
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
      onClick={() => setSyncModalOpen(true)}
    >
      <Tag className="w-4 h-4" />
      Tag visible records in {DataSourceTypeLabels[dataSource.config.type]}
    </Button>
  ) : null;

  const handleSyncConfirm = (newTagName: string) => {
    if (!newTagName) {
      return;
    }

    const recordIds = (dataRecordsResult?.records || []).map((r) => r.id);

    // Close the modal immediately, but only mark the tag as pending once the
    // server confirms success. This avoids leaving the UI stuck in a syncing
    // state (and persisting it to localStorage) if the mutation fails.
    setSyncModalOpen(false);

    tagRecords(
      {
        dataSourceId: dataSource.id,
        viewId: view.id,
        columnName: newTagName,
      },
      {
        onSuccess: () => {
          setPendingTag({
            dataSourceId: dataSource.id,
            columnName: newTagName,
            matchedRecordIds: recordIds,
          });
          setPendingTagColumnName(newTagName);
          setMatchedRecordIds(new Set(recordIds));
        },
      },
    );
  };

  return (
    <div className="h-full">
      <DataTable
        title={dataSource.name}
        buttons={[syncToCRMButton]}
        loading={dataRecordsLoading || lookingUpPage}
        columns={columnsWithTag}
        data={dataWithTag}
        recordCount={dataRecordsResult?.count}
        filter={filter}
        pageIndex={tablePage}
        setPageIndex={setTablePage}
        sort={dataSourceView?.sort || []}
        setSort={(sort) => updateDataSourceView({ sort })}
        onRowClick={handleRowClick}
        selectedRecordId={focusedRecord?.id}
        onClose={() => handleDataSourceSelect("")}
        highlightedColumns={highlightedColumns}
      />
      {enableSyncToCRM && (
        <SyncToCrmModal
          open={syncModalOpen}
          onOpenChange={setSyncModalOpen}
          onConfirm={handleSyncConfirm}
          dataSourceType={dataSource.config.type}
          columns={dataSource.columnDefs}
          mapName={map?.name || ""}
          viewName={view.name}
          records={dataRecordsResult?.records || []}
        />
      )}
    </div>
  );
}
