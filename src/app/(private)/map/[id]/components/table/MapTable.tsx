import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Tag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useDataRecords } from "@/app/(private)/map/[id]/hooks/useDataRecords";
import { useDataSourceColumns } from "@/app/(private)/map/[id]/hooks/useDataSourceColumn";
import { useInspectorState } from "@/app/(private)/map/[id]/hooks/useInspectorState";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/(private)/map/[id]/hooks/useTable";
import { useTimelineFilter } from "@/app/(private)/map/[id]/hooks/useTimelineFilter";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { DataSourceFeatures } from "@/features";
import { useFeatureFlagEnabled } from "@/hooks";
import { useDataSources } from "@/hooks/useDataSources";
import { useOrganisations } from "@/hooks/useOrganisations";
import { DataSourceTypeLabels } from "@/labels";
import { ColumnSemanticType, ColumnType } from "@/models/DataSource";
import { FilterType, MarkerIconMode } from "@/models/MapView";
import { Feature } from "@/models/Organisation";
import { ColumnDisplayFormat } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  RECORD_DATE_DISPLAY_FORMAT,
  buildName,
  parseDateValue,
} from "@/utils/dataRecord";
import { getCategoryColorsKey } from "../../colors";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { useMapId, useMapRef } from "../../hooks/useMapCore";
import { useMapQuery } from "../../hooks/useMapQuery";
import { parseColumnNumber } from "../../utils/stats";
import { getBarColorForLabel } from "../InspectorPanel/inspectorPanelOptions";
import { DataTable } from "./DataTable";
import MapTableFilter from "./MapTableFilter";
import SyncToCrmModal from "./SyncToCrmModal";
import type { ColumnMetadata } from "@/models/DataSource";
import type { DataSourceView } from "@/models/MapView";
import type { InspectorColumn } from "@/models/shared";

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
  const { view, updateView, viewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { activeRange } = useTimelineFilter();
  const { focusedRecord, setFocusedRecord } = useInspectorState();
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
    if (selectedDataSourceId && focusedRecord?.dataSourceId) {
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
            timelineRange:
              activeRange &&
              getDataSourceById(selectedDataSourceId)?.columnRoles.dateColumn
                ? activeRange
                : undefined,
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
    activeRange,
    dataRecordsLoading,
    dataRecordsResult?.records,
    dataSourceView,
    focusedRecord,
    getDataSourceById,
    lookingUpPage,
    queryClient,
    selectedDataSourceId,
    setTablePage,
    tablePage,
    trpc.dataRecord.findPageIndex,
    view,
  ]);

  const dataSource = getDataSourceById(selectedDataSourceId);

  const organisationId = useOrganisationId();
  const isOwner = Boolean(
    organisationId &&
    dataSource &&
    dataSource.organisationId === organisationId,
  );

  const { currentOrganisation } = useOrganisations();

  const enableSyncToCRM =
    useFeatureFlagEnabled(Feature.SyncToCrm, currentOrganisation?.features) &&
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

  // Value colours (incl. org overrides) per column, so cells with a
  // configured colour render as badges
  const { columnMetadata: resolvedColumnMetadata } =
    useDataSourceColumns(selectedDataSourceId);
  const valueColorsByColumn = useMemo(() => {
    const result: Record<string, Record<string, string>> = {};
    for (const meta of resolvedColumnMetadata) {
      if (meta.valueColors && Object.keys(meta.valueColors).length > 0) {
        result[meta.name] = meta.valueColors;
      }
    }
    return result;
  }, [resolvedColumnMetadata]);

  const getCellColor = useCallback(
    ({ columnName, value }: { columnName: string; value: unknown }) => {
      if (typeof value !== "string" && typeof value !== "number") {
        return undefined;
      }
      const key = String(value);
      // Same resolution as the markers: this view's overrides first, then
      // the column's durable valueColors
      const viewColor =
        viewConfig.colorMappings?.[
          getCategoryColorsKey(selectedDataSourceId, columnName, key)
        ];
      if (viewColor) {
        return viewColor;
      }
      const valueColors = valueColorsByColumn[columnName];
      if (!valueColors) {
        return undefined;
      }
      return valueColors[key] ?? valueColors[key.trim()];
    },
    [valueColorsByColumn, viewConfig.colorMappings, selectedDataSourceId],
  );

  // Cells of the map's icon column show each value's marker shape
  const visualisation = viewConfig.markerVisualisations?.[selectedDataSourceId];
  const iconColumn =
    visualisation?.iconMode === MarkerIconMode.Categories
      ? visualisation.iconColumn
      : undefined;
  const iconValueIcons = useMemo(
    () =>
      iconColumn
        ? resolvedColumnMetadata.find((m) => m.name === iconColumn)?.valueIcons
        : undefined,
    [iconColumn, resolvedColumnMetadata],
  );
  const getCellShape = useCallback(
    ({ columnName, value }: { columnName: string; value: unknown }) => {
      if (
        columnName !== iconColumn ||
        (typeof value !== "string" && typeof value !== "number")
      ) {
        return undefined;
      }
      const key = String(value);
      return iconValueIcons?.[key] ?? iconValueIcons?.[key.trim()];
    },
    [iconColumn, iconValueIcons],
  );

  // Inspector display formats applied in the table too; the resolved config
  // falls back to the data source's defaults
  const inspectorConfig = useInspectorDataSourceConfig(selectedDataSourceId);
  const inspectorColumnsByName = useMemo(() => {
    const result = new Map<string, InspectorColumn>();
    for (const item of inspectorConfig?.items ?? []) {
      if (item.type === "column") {
        result.set(item.name, item);
      }
    }
    return result;
  }, [inspectorConfig]);

  const booleanColumns = useMemo(() => {
    const result = new Set<string>();
    for (const [name, item] of inspectorColumnsByName) {
      if (item.displayFormat === ColumnDisplayFormat.Boolean) {
        result.add(name);
      }
    }
    return result;
  }, [inspectorColumnsByName]);

  // Percentage cells mirror the inspector exactly: parseColumnNumber applies
  // the column's 0-1 vs 0-100 semantic type (incl. org overrides)
  const metadataByColumn = useMemo(() => {
    const result = new Map<string, ColumnMetadata>();
    for (const meta of resolvedColumnMetadata) {
      result.set(meta.name, meta);
    }
    return result;
  }, [resolvedColumnMetadata]);
  const getCellPercentage = useCallback(
    ({ columnName, value }: { columnName: string; value: unknown }) => {
      const item = inspectorColumnsByName.get(columnName);
      if (item?.displayFormat !== ColumnDisplayFormat.Percentage) {
        return undefined;
      }
      const columnMetadata = metadataByColumn.get(columnName);
      const num = parseColumnNumber(value, {
        isCount: false,
        columnMetadata,
      });
      if (num === null) {
        return undefined;
      }
      return {
        percent: Math.min(100, Math.max(0, num)),
        barColor: getBarColorForLabel({
          columnName,
          displayName: columnMetadata?.displayName,
          barColor: item.barColor,
          inspectorColor: inspectorConfig?.color,
        }),
      };
    },
    [inspectorColumnsByName, metadataByColumn, inspectorConfig?.color],
  );

  // Scale cells mirror the inspector: the value is the filled segment count
  // out of the column's configured scaleMax (no range inference)
  const getCellScale = useCallback(
    ({ columnName, value }: { columnName: string; value: unknown }) => {
      const item = inspectorColumnsByName.get(columnName);
      if (item?.displayFormat !== ColumnDisplayFormat.Scale) {
        return undefined;
      }
      const columnMetadata = metadataByColumn.get(columnName);
      const num = parseColumnNumber(value, {
        isCount: false,
        columnMetadata,
      });
      if (num === null) {
        return undefined;
      }
      const max = Math.max(2, Math.min(10, item.scaleMax || 2));
      return {
        filled: Math.min(max, Math.max(0, Math.round(num))),
        max,
        barColor: getBarColorForLabel({
          columnName,
          displayName: columnMetadata?.displayName,
          barColor: item.barColor,
          inspectorColor: inspectorConfig?.color,
        }),
      };
    },
    [inspectorColumnsByName, metadataByColumn, inspectorConfig?.color],
  );

  // Date semantic type columns pretty-print ("28 May 2026"), matching the
  // inspector
  const getCellText = useCallback(
    ({ columnName, value }: { columnName: string; value: unknown }) => {
      const columnMetadata = metadataByColumn.get(columnName);
      if (columnMetadata?.semanticType !== ColumnSemanticType.Date) {
        return undefined;
      }
      const date = parseDateValue(
        value,
        getDataSourceById(selectedDataSourceId)?.dateFormat,
      );
      return date ? format(date, RECORD_DATE_DISPLAY_FORMAT) : undefined;
    },
    [metadataByColumn, getDataSourceById, selectedDataSourceId],
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
        getCellColor={getCellColor}
        getCellShape={getCellShape}
        getCellPercentage={getCellPercentage}
        getCellScale={getCellScale}
        booleanColumns={booleanColumns}
        getCellText={getCellText}
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
