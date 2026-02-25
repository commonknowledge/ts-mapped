"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BarChart3,
  GripVertical,
  LayoutGrid,
  LayoutList,
  MapPin,
  PlusIcon,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import {
  type InspectorBoundaryConfig,
  InspectorBoundaryConfigType,
  type InspectorChartDataSource,
  type InspectorColumnFormat,
} from "@/server/models/MapView";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";
import { useDataSources } from "../../hooks/useDataSources";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useMapViews } from "../../hooks/useMapViews";
import { InspectorFullPreview } from "./InspectorFullPreview";
import {
  INSPECTOR_COLOR_OPTIONS,
  INSPECTOR_ICON_OPTIONS,
} from "./inspectorPanelOptions";
import { SortableColumnRow } from "./SortableColumnRow";
import type { DataSource } from "@/server/models/DataSource";
import type { DragEndEvent } from "@dnd-kit/core";

const SELECTED_DROPPABLE_ID = "selected-columns";
/** Sentinel for Select default option (Radix Select.Item cannot have value="") */
const DEFAULT_SELECT_VALUE = "__default__";

type InspectorLayout = "single" | "twoColumn";

/** Infer column format from name: Percentage if name contains % or "percentage". */
function inferFormat(columnName: string): InspectorColumnFormat | undefined {
  const lower = columnName.toLowerCase();
  if (lower.includes("%") || lower.includes("percentage")) return "percentage";
  return undefined;
}

export default function InspectorSettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const { data: dataSources, getDataSourceById } = useDataSources();
  const { view, viewConfig, updateView } = useMapViews();

  const boundaryConfigs = view?.inspectorConfig?.boundaries ?? [];
  const onMapId = viewConfig.areaDataSourceId || null;

  const filteredSources = useMemo(() => {
    const list = dataSources ?? [];
    if (!debouncedSearchQuery.trim()) return list;
    const q = debouncedSearchQuery.toLowerCase();
    return list.filter(
      (ds) =>
        ds.name.toLowerCase().includes(q) ||
        ds.columnDefs.some((col) => col.name.toLowerCase().includes(q)),
    );
  }, [dataSources, debouncedSearchQuery]);

  const matchesSearch = useCallback(
    (ds: DataSource) => {
      if (!debouncedSearchQuery.trim()) return true;
      const q = debouncedSearchQuery.toLowerCase();
      return (
        ds.name.toLowerCase().includes(q) ||
        ds.columnDefs.some((col) => col.name.toLowerCase().includes(q))
      );
    },
    [debouncedSearchQuery],
  );

  const { inspectorOrdered, otherSources } = useMemo(() => {
    const inInspector = boundaryConfigs
      .map((config) => ({
        config,
        dataSource: getDataSourceById(config.dataSourceId),
      }))
      .filter(
        (
          x,
        ): x is {
          config: InspectorBoundaryConfig;
          dataSource: NonNullable<ReturnType<typeof getDataSourceById>>;
        } => x.dataSource != null && matchesSearch(x.dataSource),
      );
    const inIds = new Set(inInspector.map((x) => x.dataSource.id));
    const other = (filteredSources ?? []).filter((ds) => !inIds.has(ds.id));
    return { inspectorOrdered: inInspector, otherSources: other };
  }, [boundaryConfigs, getDataSourceById, filteredSources, matchesSearch]);

  const handleRemoveFromInspector = useCallback(
    (configId: string) => {
      if (!view) return;
      const next = boundaryConfigs.filter((c) => c.id !== configId);
      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          boundaries: next,
        },
      });
    },
    [view, boundaryConfigs, updateView],
  );

  const selectedConfig = useMemo(
    () =>
      selectedDataSourceId
        ? (boundaryConfigs.find(
            (c) => c.dataSourceId === selectedDataSourceId,
          ) ?? null)
        : null,
    [selectedDataSourceId, boundaryConfigs],
  );
  const selectedDataSource = useMemo(
    () =>
      selectedDataSourceId
        ? ((dataSources ?? []).find((ds) => ds.id === selectedDataSourceId) ??
          null)
        : null,
    [selectedDataSourceId, dataSources],
  );

  const handleAddToInspector = useCallback(() => {
    if (!view || !selectedDataSourceId) return;
    const ds = (dataSources ?? []).find((d) => d.id === selectedDataSourceId);
    const newConfig: InspectorBoundaryConfig = {
      id: uuidv4(),
      dataSourceId: selectedDataSourceId,
      name: ds?.name ?? "Boundary Data",
      type: InspectorBoundaryConfigType.Simple,
      columns: [],
      columnMetadata: undefined,
      columnGroups: undefined,
      layout: "single",
    };
    const prev = view.inspectorConfig?.boundaries ?? [];
    updateView({
      ...view,
      inspectorConfig: {
        ...view.inspectorConfig,
        boundaries: [...prev, newConfig],
      },
    });
  }, [view, selectedDataSourceId, dataSources, updateView]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ width: "90vw", maxWidth: "1400px" }}
        onPointerDownOutside={() => setSelectedDataSourceId(null)}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Inspector settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose data sources to show in the inspector and configure columns,
            order, and layout.
          </p>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 min-w-0">
          {/* Left: data sources list (inspector ones first, order synced from preview) */}
          <div className="w-72 shrink-0 border-r flex flex-col">
            <div className="p-2 border-b">
              <Input
                placeholder="Search data sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {inspectorOrdered.length > 0 && (
                <section className="pb-2 border-b border-neutral-200">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
                    Showing inspector
                  </h3>
                  <div className="space-y-0.5">
                    {inspectorOrdered.map(({ config, dataSource: ds }) => {
                      const isOnMap = ds.id === onMapId;
                      const isSelected = ds.id === selectedDataSourceId;
                      return (
                        <div
                          key={ds.id}
                          className={cn(
                            "rounded-lg border transition-colors flex items-center gap-2",
                            isSelected
                              ? "bg-primary/10 border-primary/30"
                              : "border-transparent",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedDataSourceId(ds.id)}
                            className="flex-1 min-w-0 text-left rounded-lg p-2.5 flex items-center gap-2 hover:bg-neutral-50"
                          >
                            <span className="shrink-0">
                              <DataSourceIcon
                                type={getDataSourceType(
                                  ds as Parameters<typeof getDataSourceType>[0],
                                )}
                              />
                            </span>
                            <span className="flex-1 min-w-0 truncate text-sm font-medium">
                              {ds.name}
                            </span>
                            {isOnMap && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 shrink-0"
                                title="Used for map colour"
                              >
                                <MapPin className="w-2.5 h-2.5" />
                                On map
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromInspector(config.id);
                            }}
                            className="shrink-0 p-1.5 rounded text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
                            title="Remove from inspector"
                            aria-label="Remove from inspector"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
              {otherSources.length > 0 && (
                <div
                  className={cn("pt-2", inspectorOrdered.length > 0 && "mt-2")}
                >
                  {otherSources.map((ds) => {
                    const isOnMap = ds.id === onMapId;
                    const isSelected = ds.id === selectedDataSourceId;
                    return (
                      <button
                        type="button"
                        key={ds.id}
                        onClick={() => setSelectedDataSourceId(ds.id)}
                        className={cn(
                          "w-full text-left rounded-lg p-2.5 flex items-center gap-2 border transition-colors",
                          isSelected
                            ? "bg-primary/10 border-primary/30"
                            : "hover:bg-neutral-50 border-transparent",
                        )}
                      >
                        <span className="shrink-0">
                          <DataSourceIcon type={getDataSourceType(ds)} />
                        </span>
                        <span className="flex-1 min-w-0 truncate text-sm font-medium">
                          {ds.name}
                        </span>
                        <div className="flex shrink-0 gap-1">
                          {isOnMap && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800"
                              title="Used for map colour"
                            >
                              <MapPin className="w-2.5 h-2.5" />
                              On map
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {inspectorOrdered.length === 0 && otherSources.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">
                  No data sources match.
                </p>
              )}
            </div>
          </div>

          {/* Middle: config panel (flexes to fill space between list and preview) */}
          <div className="flex-1 min-w-0 border-r flex flex-col overflow-hidden">
            {selectedDataSource && view ? (
              <InspectorSourceConfigPanel
                dataSource={selectedDataSource}
                config={selectedConfig}
                onAddToInspector={handleAddToInspector}
                isInInspector={!!selectedConfig}
                view={view}
                updateView={updateView}
                boundaryConfigs={boundaryConfigs}
              />
            ) : selectedDataSource ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6">
                No view loaded.
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6">
                Select a data source to configure columns (drag them into the
                list).
              </div>
            )}
          </div>

          {/* Right: full inspector preview (same width as real inspector panel: 250–450px) */}
          <div
            className="flex flex-col shrink-0 overflow-hidden p-4 bg-neutral-50"
            style={{ width: "380px", minWidth: "250px", maxWidth: "450px" }}
          >
            <InspectorFullPreview
              className="h-full min-h-0"
              selectedDataSourceId={selectedDataSourceId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InspectorSourceConfigPanel({
  dataSource,
  config,
  onAddToInspector,
  isInInspector,
  view,
  updateView,
  boundaryConfigs,
}: {
  dataSource: DataSource;
  config: InspectorBoundaryConfig | null;
  onAddToInspector: () => void;
  isInInspector: boolean;
  view: NonNullable<ReturnType<typeof useMapViews>["view"]>;
  updateView: ReturnType<typeof useMapViews>["updateView"];
  boundaryConfigs: InspectorBoundaryConfig[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columns = config?.columns ?? [];
  const allColumnNames = useMemo(
    () => dataSource.columnDefs.map((c) => c.name),
    [dataSource.columnDefs],
  );
  const allColumnsSorted = useMemo(
    () =>
      [...allColumnNames].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [allColumnNames],
  );
  /** Full list order: use saved columnOrder when valid; else selected at top then alphabetical. */
  const allColumnsInOrder = useMemo(() => {
    const order = config?.columnOrder?.filter((c) =>
      allColumnNames.includes(c),
    );
    if (order?.length === allColumnNames.length) return order;
    const selected = columns.filter((c) => allColumnNames.includes(c));
    const rest = allColumnsSorted.filter((c) => !selected.includes(c));
    return [...selected, ...rest];
  }, [config?.columnOrder, allColumnNames, allColumnsSorted, columns]);
  const availableColumns = useMemo(
    () => allColumnsInOrder.filter((c) => !columns.includes(c)),
    [allColumnsInOrder, columns],
  );
  const availableIds = useMemo(
    () => allColumnsInOrder.map((c) => `available-${c}`),
    [allColumnsInOrder],
  );
  /** Selected columns in same order as left list (so both columns match) */
  const selectedColumnsInOrder = useMemo(
    () => allColumnsInOrder.filter((c) => columns.includes(c)),
    [allColumnsInOrder, columns],
  );
  const columnIds = useMemo(
    () => selectedColumnsInOrder.map((c) => `col-${c}`),
    [selectedColumnsInOrder],
  );

  const updateConfig = useCallback(
    (updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig) => {
      if (!view || !config) return;
      const updated = updater(config);
      const index = boundaryConfigs.findIndex((c) => c.id === config.id);
      if (index < 0) return;
      const next = [...boundaryConfigs];
      next[index] = updated;
      updateView({
        ...view,
        inspectorConfig: { ...view.inspectorConfig, boundaries: next },
      });
    },
    [view, config, boundaryConfigs, updateView],
  );

  const [displayName, setDisplayName] = useState(config?.name ?? "");
  useEffect(() => setDisplayName(config?.name ?? ""), [config?.name]);
  const debouncedUpdateName = useDebouncedCallback(
    (value: string) => updateConfig((prev) => ({ ...prev, name: value })),
    600,
  );

  const handleAddColumn = useCallback(
    (colName: string) => {
      const inferred = inferFormat(colName);
      updateConfig((prev) => {
        const order = prev.columnOrder?.filter((c) =>
          allColumnNames.includes(c),
        );
        const baseOrder =
          order?.length === allColumnNames.length ? order : allColumnsSorted;
        const newOrder = [
          colName,
          ...baseOrder.filter((c) => c !== colName),
        ];
        return {
          ...prev,
          columns: [colName, ...prev.columns],
          columnOrder: newOrder,
          columnMetadata: {
            ...prev.columnMetadata,
            [colName]: {
              ...prev.columnMetadata?.[colName],
              format:
                prev.columnMetadata?.[colName]?.format ?? inferred ?? undefined,
            },
          },
        };
      });
    },
    [updateConfig, allColumnNames, allColumnsSorted],
  );

  const handleRemoveColumn = useCallback(
    (colName: string) => {
      updateConfig((prev) => {
        const nextColumns = prev.columns.filter((c) => c !== colName);
        const nextMeta = Object.fromEntries(
          Object.entries(prev.columnMetadata ?? {}).filter(
            ([k]) => k !== colName,
          ),
        );
        const nextChartColumnNames = (prev.chart?.columnNames ?? []).filter(
          (c) => c !== colName,
        );
        const order = prev.columnOrder?.filter((c) =>
          allColumnNames.includes(c),
        );
        const baseOrder =
          order?.length === allColumnNames.length ? order : allColumnsSorted;
        const newOrder = [
          ...baseOrder.filter((c) => c !== colName),
          colName,
        ];
        return {
          ...prev,
          columns: nextColumns,
          columnOrder: newOrder,
          columnMetadata: nextMeta,
          chart:
            prev.chart && nextChartColumnNames.length >= 0
              ? {
                  ...prev.chart,
                  columnNames:
                    nextChartColumnNames.length > 0
                      ? nextChartColumnNames
                      : undefined,
                }
              : prev.chart,
        };
      });
    },
    [updateConfig, allColumnNames, allColumnsSorted],
  );

  /** Remove from right list and move to bottom of left list (keeps order in sync) */
  const handleRemoveColumnFromRight = useCallback(
    (colName: string) => {
      updateConfig((prev) => {
        const nextColumns = prev.columns.filter((c) => c !== colName);
        const nextMeta = Object.fromEntries(
          Object.entries(prev.columnMetadata ?? {}).filter(
            ([k]) => k !== colName,
          ),
        );
        const nextChartColumnNames = (prev.chart?.columnNames ?? []).filter(
          (c) => c !== colName,
        );
        const newColumnOrder = [
          ...nextColumns,
          ...allColumnsInOrder.filter((c) => !nextColumns.includes(c)),
        ];
        return {
          ...prev,
          columns: nextColumns,
          columnOrder: newColumnOrder,
          columnMetadata: nextMeta,
          chart:
            prev.chart && nextChartColumnNames.length >= 0
              ? {
                  ...prev.chart,
                  columnNames:
                    nextChartColumnNames.length > 0
                      ? nextChartColumnNames
                      : undefined,
                }
              : prev.chart,
        };
      });
    },
    [updateConfig, allColumnsInOrder],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!config) return;
      const activeStr = String(active.id);
      const overStr = over ? String(over.id) : null;

      if (activeStr.startsWith("col-") && overStr?.startsWith("col-")) {
        const oldIndex = columnIds.indexOf(activeStr);
        const newIndex = columnIds.indexOf(overStr);
        if (oldIndex === -1 || newIndex === -1) return;
        const next = [...selectedColumnsInOrder];
        const [removed] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, removed);
        const newColumnOrder = [
          ...next,
          ...allColumnsInOrder.filter((c) => !next.includes(c)),
        ];
        updateConfig((prev) => ({
          ...prev,
          columns: next,
          columnOrder: newColumnOrder,
        }));
        return;
      }
      if (
        activeStr.startsWith("available-") &&
        overStr?.startsWith("available-")
      ) {
        const activeCol = activeStr.slice("available-".length);
        const overCol = overStr.slice("available-".length);
        const oldIdx = allColumnsInOrder.indexOf(activeCol);
        const newIdx = allColumnsInOrder.indexOf(overCol);
        if (oldIdx === -1 || newIdx === -1) return;
        const nextOrder = [...allColumnsInOrder];
        const [removed] = nextOrder.splice(oldIdx, 1);
        nextOrder.splice(newIdx, 0, removed);
        updateConfig((prev) => ({ ...prev, columnOrder: nextOrder }));
      }
    },
    [
      columnIds,
      config,
      updateConfig,
      allColumnsInOrder,
      selectedColumnsInOrder,
    ],
  );

  if (!isInInspector) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">
          <strong>{dataSource.name}</strong> is not shown in the inspector yet.
        </p>
        <button
          type="button"
          onClick={onAddToInspector}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon className="w-4 h-4" />
          Add to inspector
        </button>
      </div>
    );
  }

  if (!config) return null;

  const columnMetadata = config.columnMetadata ?? {};
  const layout = (config.layout ?? "single") as InspectorLayout;
  const panelIcon = config.icon ?? undefined;
  const panelColor = config.color ?? undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 items-end gap-4 border-b pb-6">
          <div className="space-y-2 min-w-[200px]">
            <Label className="text-muted-foreground">Display name</Label>
            <Input
              value={displayName}
              onChange={(e) => {
                const v = e.target.value;
                setDisplayName(v);
                debouncedUpdateName(v);
              }}
              placeholder="e.g. Main data"
              className="max-w-sm"
            />
          </div>
          <div className="space-y-2 min-w-[140px]">
            <Label className="text-muted-foreground">Icon</Label>
            <Select
              value={panelIcon ?? DEFAULT_SELECT_VALUE}
              onValueChange={(value) =>
                updateConfig((prev) => ({
                  ...prev,
                  icon: value === DEFAULT_SELECT_VALUE ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTOR_ICON_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value || "default"}
                    value={opt.value || DEFAULT_SELECT_VALUE}
                  >
                    <span className="flex items-center gap-2">
                      <opt.Icon className="h-4 w-4 shrink-0" />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[120px]">
            <Label className="text-muted-foreground">Colour</Label>
            <Select
              value={panelColor ?? DEFAULT_SELECT_VALUE}
              onValueChange={(value) =>
                updateConfig((prev) => ({
                  ...prev,
                  color: value === DEFAULT_SELECT_VALUE ? undefined : value,
                }))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTOR_COLOR_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value || "default"}
                    value={opt.value || DEFAULT_SELECT_VALUE}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-4 w-4 shrink-0 rounded-full border border-neutral-200",
                          opt.value ? opt.className : "bg-neutral-100",
                        )}
                      />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Layout</Label>
            <div className="flex items-center gap-2">
              <LayoutList className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={layout === "twoColumn"}
                onCheckedChange={(checked) =>
                  updateConfig((prev) => ({
                    ...prev,
                    layout: checked ? "twoColumn" : "single",
                  }))
                }
              />
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {layout === "single" ? "Single column" : "Two-column grid"}
            </p>
          </div>
        </div>

        <div className="space-y-2 border-b pb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <Label className="text-muted-foreground">Chart</Label>
          </div>
          <div className="flex flex-col  gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.chart?.enabled ?? false}
                onCheckedChange={(checked) =>
                  updateConfig((prev) => ({
                    ...prev,
                    chart: {
                      enabled: checked,
                      dataSource: prev.chart?.dataSource ?? "percentage",
                      columnNames: prev.chart?.columnNames,
                      hideZeroValues: prev.chart?.hideZeroValues,
                      hideChartColumnsFromList:
                        prev.chart?.hideChartColumnsFromList,
                    },
                  }))
                }
              />
              <span className="text-sm">Show chart at top</span>
            </div>

            {(config.chart?.enabled ?? false) && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  Data:
                </Label>
                <Select
                  value={config.chart?.dataSource ?? "percentage"}
                  onValueChange={(value: InspectorChartDataSource) =>
                    updateConfig((prev) => {
                      const chart = prev.chart ?? {
                        enabled: true,
                        dataSource: "percentage" as const,
                        columnNames: undefined,
                      };
                      return {
                        ...prev,
                        chart: {
                          ...chart,
                          enabled: true,
                          dataSource: value,
                          columnNames:
                            value === "custom"
                              ? (chart.columnNames ?? [])
                              : undefined,
                        },
                      };
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      Use columns with Percentage format
                    </SelectItem>
                    <SelectItem value="number">
                      Use columns with Number format
                    </SelectItem>
                    <SelectItem value="scale">
                      Use columns with Scale format
                    </SelectItem>
                    <SelectItem value="custom">
                      Select from Columns to show list
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(config.chart?.enabled ?? false) && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.chart?.hideZeroValues ?? false}
                  disabled={config.chart?.hideChartColumnsFromList ?? false}
                  onCheckedChange={(checked) =>
                    updateConfig((prev) => {
                      const ch = prev.chart ?? {
                        enabled: true,
                        dataSource: "percentage" as const,
                        columnNames: undefined,
                      };
                      return {
                        ...prev,
                        chart: {
                          ...ch,
                          hideZeroValues: checked,
                          hideChartColumnsFromList: checked
                            ? false
                            : ch.hideChartColumnsFromList,
                        },
                      };
                    })
                  }
                />
                <span className="text-sm">Hide zero values from the chart</span>
              </div>
            )}
            {(config.chart?.enabled ?? false) && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.chart?.hideChartColumnsFromList ?? false}
                  disabled={config.chart?.hideZeroValues ?? false}
                  onCheckedChange={(checked) =>
                    updateConfig((prev) => {
                      const ch = prev.chart ?? {
                        enabled: true,
                        dataSource: "percentage" as const,
                        columnNames: undefined,
                      };
                      return {
                        ...prev,
                        chart: {
                          ...ch,
                          hideChartColumnsFromList: checked,
                          hideZeroValues: checked ? false : ch.hideZeroValues,
                        },
                      };
                    })
                  }
                />
                <span className="text-sm">
                  Hide data used in chart from list below
                </span>
              </div>
            )}
          </div>
          {(config.chart?.enabled ?? false) &&
            (config.chart?.dataSource ?? "percentage") === "custom" && (
              <p className="text-xs text-muted-foreground">
                Tick “Include in chart” on each column in Columns to show below.
              </p>
            )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-muted-foreground">Columns</Label>
              <p className="text-xs text-muted-foreground">
                Tick columns in Available to add. Reorder in Columns to show
                with the handle.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  updateConfig((prev) => {
                    const nextColumns = [
                      ...(prev.columns ?? []),
                      ...availableColumns,
                    ];
                    const nextMeta = { ...prev.columnMetadata };
                    availableColumns.forEach((col) => {
                      const inferred = inferFormat(col);
                      if (inferred && nextMeta[col]?.format == null) {
                        nextMeta[col] = { ...nextMeta[col], format: inferred };
                      } else if (inferred && !nextMeta[col]) {
                        nextMeta[col] = { format: inferred };
                      }
                    });
                    return {
                      ...prev,
                      columns: nextColumns,
                      columnOrder: nextColumns,
                      columnMetadata: nextMeta,
                    };
                  })
                }
                disabled={availableColumns.length === 0}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                Add all
              </button>
              <button
                type="button"
                onClick={() =>
                  updateConfig((prev) => ({ ...prev, columns: [] }))
                }
                disabled={columns.length === 0}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                Remove all
              </button>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveId(active.id as string)}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  All columns (selected at top, drag to reorder, tick to add)
                </p>
                <AvailableColumnsCheckboxList
                  allColumnsInOrder={allColumnsInOrder}
                  selectedColumns={columns}
                  onAddColumn={handleAddColumn}
                  onRemoveColumn={handleRemoveColumn}
                  availableIds={availableIds}
                  activeId={activeId}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Columns to show
                </p>
                <DroppableSelectedColumns
                  columns={selectedColumnsInOrder}
                  columnMetadata={columnMetadata}
                  updateConfig={updateConfig}
                  onRemoveColumn={handleRemoveColumnFromRight}
                  activeId={activeId}
                  chartDataSource={
                    config.chart?.enabled
                      ? (config.chart?.dataSource ?? null)
                      : null
                  }
                  chartColumnNames={config.chart?.columnNames}
                />
              </div>
            </div>
            {typeof document !== "undefined" &&
              createPortal(
                <DragOverlay
                  dropAnimation={{ duration: 200, easing: "ease" }}
                  modifiers={[
                    ({ transform }) => ({
                      ...transform,
                      x: transform.x,
                      y: transform.y,
                    }),
                  ]}
                >
                  {activeId && String(activeId).startsWith("col-") ? (
                    <ColumnDragPreview
                      activeId={String(activeId)}
                      columnMetadata={columnMetadata}
                    />
                  ) : activeId && String(activeId).startsWith("available-") ? (
                    <AvailableDragPreview activeId={String(activeId)} />
                  ) : null}
                </DragOverlay>,
                document.body,
              )}
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function ColumnDragPreview({
  activeId,
  columnMetadata,
}: {
  activeId: string;
  columnMetadata: Record<string, { displayName?: string }>;
}) {
  const columnName = activeId.startsWith("col-")
    ? activeId.slice("col-".length)
    : "";
  const displayName = columnMetadata[columnName]?.displayName;

  return (
    <div className="flex flex-col gap-1.5 rounded border-2 border-primary/30 bg-white py-1.5 px-2 shadow-lg min-w-[140px]">
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grabbing" />
        <span
          className="text-xs font-mono text-muted-foreground flex-1 truncate"
          title={columnName}
        >
          {columnName}
        </span>
      </div>
      <span className="text-sm font-medium truncate pl-5">
        {displayName || columnName || "—"}
      </span>
    </div>
  );
}

function AvailableDragPreview({ activeId }: { activeId: string }) {
  const columnName = activeId.startsWith("available-")
    ? activeId.slice("available-".length)
    : "";
  return (
    <div className="flex items-center gap-2 rounded border-2 border-primary/30 bg-white py-1.5 px-2 shadow-lg min-w-[140px]">
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grabbing" />
      <span
        className="text-xs font-mono text-muted-foreground flex-1 truncate"
        title={columnName}
      >
        {columnName}
      </span>
    </div>
  );
}

function SortableAvailableRow({
  id,
  columnName,
  selected,
  onToggle,
  isDragging,
}: {
  id: string;
  columnName: string;
  selected: boolean;
  onToggle: (checked: boolean) => void;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndDragging,
  } = useSortable({ id });
  const dragging = isDragging ?? dndDragging;
  const style = dragging
    ? { transition }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded py-1.5 px-2 text-sm hover:bg-neutral-100/80",
        dragging && "opacity-0 pointer-events-none",
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 -ml-0.5 shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={
          selected
            ? `Remove ${columnName} from columns to show`
            : `Add ${columnName} to columns to show`
        }
      />
      <span className="truncate font-mono text-xs flex-1">{columnName}</span>
    </div>
  );
}

function AvailableColumnsCheckboxList({
  allColumnsInOrder,
  selectedColumns,
  onAddColumn,
  onRemoveColumn,
  availableIds,
  activeId,
}: {
  allColumnsInOrder: string[];
  selectedColumns: string[];
  onAddColumn: (columnName: string) => void;
  onRemoveColumn: (columnName: string) => void;
  availableIds: string[];
  activeId: string | null;
}) {
  return (
    <div className="rounded border border-dashed border-neutral-200 bg-neutral-50/50 p-2 min-h-[360px] max-h-[520px] overflow-y-auto space-y-1">
      <SortableContext
        items={availableIds}
        strategy={verticalListSortingStrategy}
      >
        {allColumnsInOrder.map((col) => (
          <SortableAvailableRow
            key={col}
            id={`available-${col}`}
            columnName={col}
            selected={selectedColumns.includes(col)}
            onToggle={(checked) =>
              checked ? onAddColumn(col) : onRemoveColumn(col)
            }
            isDragging={activeId === `available-${col}`}
          />
        ))}
      </SortableContext>
      {allColumnsInOrder.length === 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center">
          No columns in this data source
        </p>
      )}
    </div>
  );
}

function DroppableSelectedColumns({
  columns,
  columnMetadata,
  updateConfig,
  onRemoveColumn,
  activeId,
  chartDataSource,
  chartColumnNames,
}: {
  columns: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  updateConfig: (
    updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig,
  ) => void;
  onRemoveColumn?: (columnName: string) => void;
  activeId: string | null;
  chartDataSource?: InspectorChartDataSource | null;
  chartColumnNames?: string[];
}) {
  const meta = columnMetadata ?? {};
  const { setNodeRef, isOver } = useDroppable({ id: SELECTED_DROPPABLE_ID });
  const columnIds = useMemo(() => columns.map((c) => `col-${c}`), [columns]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded border min-h-[360px] max-h-[520px] overflow-y-auto p-2 transition-all duration-150",
        isOver
          ? "border-2 border-primary bg-primary/10 ring-2 ring-primary/20"
          : "border-neutral-200 bg-white",
      )}
    >
      {columns.length === 0 ? (
        <p className="text-xs py-6 text-center text-muted-foreground">
          No columns — tick Available to add
        </p>
      ) : (
        <SortableContext
          items={columnIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5">
            {columns.map((col) => (
              <SortableColumnRow
                key={col}
                id={`col-${col}`}
                columnName={col}
                displayName={meta[col]?.displayName}
                onDisplayNameChange={(value) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        displayName: value || undefined,
                      },
                    },
                  }))
                }
                format={meta[col]?.format ?? "text"}
                onFormatChange={(format) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        format,
                      },
                    },
                  }))
                }
                scaleMax={meta[col]?.scaleMax ?? 3}
                onScaleMaxChange={(scaleMax) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        scaleMax,
                      },
                    },
                  }))
                }
                barColor={meta[col]?.barColor}
                onBarColorChange={(value) =>
                  updateConfig((prev) => ({
                    ...prev,
                    columnMetadata: {
                      ...(prev.columnMetadata ?? {}),
                      [col]: {
                        ...(prev.columnMetadata?.[col] ?? {}),
                        barColor: value || undefined,
                      },
                    },
                  }))
                }
                includeInChart={
                  chartDataSource === "custom" &&
                  (chartColumnNames?.includes(col) ?? false)
                }
                onIncludeInChartChange={
                  chartDataSource === "custom"
                    ? (include) =>
                        updateConfig((prev) => {
                          const current = prev.chart?.columnNames ?? [];
                          const next = include
                            ? current.includes(col)
                              ? current
                              : [...current, col]
                            : current.filter((c) => c !== col);
                          const chart = prev.chart ?? {
                            enabled: true,
                            dataSource: "custom" as const,
                            columnNames: [],
                          };
                          return {
                            ...prev,
                            chart: {
                              ...chart,
                              dataSource: "custom",
                              columnNames: next,
                            },
                          };
                        })
                    : undefined
                }
                showChartCheckbox={chartDataSource === "custom"}
                onRemove={
                  onRemoveColumn
                    ? () => onRemoveColumn(col)
                    : () =>
                        updateConfig((prev) => {
                          const nextColumns = prev.columns.filter(
                            (c) => c !== col,
                          );
                          const nextMeta = Object.fromEntries(
                            Object.entries(prev.columnMetadata ?? {}).filter(
                              ([k]) => k !== col,
                            ),
                          );
                          const nextChartColumnNames = (
                            prev.chart?.columnNames ?? []
                          ).filter((c) => c !== col);
                          return {
                            ...prev,
                            columns: nextColumns,
                            columnMetadata: nextMeta,
                            chart: prev.chart
                              ? {
                                  ...prev.chart,
                                  columnNames:
                                    nextChartColumnNames.length > 0
                                      ? nextChartColumnNames
                                      : undefined,
                                }
                              : prev.chart,
                          };
                        })
                }
                isDragging={activeId === `col-${col}`}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
