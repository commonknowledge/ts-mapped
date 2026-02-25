"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  GripVertical,
  LayoutGrid,
  LayoutList,
  MapPin,
  PlusIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import {
  type InspectorBoundaryConfig,
  InspectorBoundaryConfigType,
  type InspectorColumnGroup,
} from "@/server/models/MapView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";
import { useDataSources } from "../../hooks/useDataSources";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useMapViews } from "../../hooks/useMapViews";
import { InspectorFullPreview } from "./InspectorFullPreview";
import { SortableColumnRow } from "./SortableColumnRow";
import type { DataSource } from "@/server/models/DataSource";
import type { DragEndEvent } from "@dnd-kit/core";

const SELECTED_DROPPABLE_ID = "selected-columns";
const AVAILABLE_DROPPABLE_ID = "available-columns";

type InspectorLayout = "single" | "twoColumn";

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
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);
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
              {inspectorOrdered.map(({ dataSource: ds }) => {
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
                      <DataSourceIcon
                        type={getDataSourceType(
                          ds as Parameters<typeof getDataSourceType>[0],
                        )}
                      />
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
                      <span
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-800"
                        title="Shown in inspector"
                      >
                        In inspector
                      </span>
                    </div>
                  </button>
                );
              })}
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
            <InspectorFullPreview className="h-full min-h-0" />
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
  const columnIds = useMemo(() => columns.map((c) => `col-${c}`), [columns]);
  const allColumnNames = useMemo(
    () => dataSource.columnDefs.map((c) => c.name),
    [dataSource.columnDefs],
  );
  const availableColumns = useMemo(
    () =>
      allColumnNames
        .filter((c) => !columns.includes(c))
        .slice()
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [allColumnNames, columns],
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
    300,
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!config) return;
      const activeStr = String(active.id);
      const overStr = over ? String(over.id) : null;

      if (activeStr.startsWith("available-")) {
        // Only add to Columns to show when dropped on the CTS zone (droppable or a column row)
        const droppedOnCts =
          over != null &&
          (overStr === SELECTED_DROPPABLE_ID || overStr?.startsWith("col-"));
        if (!droppedOnCts) return;

        const colName = activeStr.slice("available-".length);
        if (!allColumnNames.includes(colName)) return;
        const insertIndex =
          overStr === SELECTED_DROPPABLE_ID
            ? columns.length
            : overStr?.startsWith("col-")
              ? columns.indexOf(overStr.slice("col-".length))
              : -1;
        if (insertIndex === -1) return;
        const idx = Math.max(0, insertIndex);
        const next = [...columns];
        next.splice(idx, 0, colName);
        updateConfig((prev) => ({ ...prev, columns: next }));
        return;
      }

      if (activeStr.startsWith("col-") && overStr?.startsWith("col-")) {
        const oldIndex = columnIds.indexOf(activeStr);
        const newIndex = columnIds.indexOf(overStr);
        if (oldIndex === -1 || newIndex === -1) return;
        const next = [...config.columns];
        const [removed] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, removed);
        updateConfig((prev) => ({ ...prev, columns: next }));
      }
    },
    [allColumnNames, columnIds, columns, config, updateConfig],
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
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

        <div className="space-y-3">
          <Label className="text-muted-foreground">Columns</Label>
          <p className="text-xs text-muted-foreground">
            Drag columns from Available into Columns to show. Reorder with the
            handle.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveId(active.id as string)}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Available (alphabetical, drag to add)
                </p>
                <AvailableColumnsList
                  availableColumns={availableColumns}
                  activeId={activeId}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Columns to show
                </p>
                <DroppableSelectedColumns
                  columns={columns}
                  columnMetadata={columnMetadata}
                  updateConfig={updateConfig}
                  activeId={activeId}
                  layout={layout}
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
                  {activeId ? (
                    <ColumnDragPreview
                      activeId={activeId}
                      columnMetadata={columnMetadata}
                    />
                  ) : null}
                </DragOverlay>,
                document.body,
              )}
          </DndContext>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
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
          </div>
          <p className="text-xs text-muted-foreground">
            {layout === "single"
              ? "Single column list (default)."
              : "Two-column grid (Airtable-style)."}
          </p>
        </div>

        <ColumnGroupsEditor config={config} updateConfig={updateConfig} />
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
  const fromAvailable = activeId.startsWith("available-");
  const columnName = fromAvailable
    ? activeId.slice("available-".length)
    : activeId.startsWith("col-")
      ? activeId.slice("col-".length)
      : "";
  const displayName = columnMetadata[columnName]?.displayName;

  if (fromAvailable) {
    return (
      <div className="flex items-center gap-2 rounded bg-white border-2 border-primary/30 py-1.5 px-2 text-sm cursor-grabbing shadow-lg">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="truncate font-mono text-xs">{columnName}</span>
      </div>
    );
  }
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

function AvailableColumnsList({
  availableColumns,
  activeId,
}: {
  availableColumns: string[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: AVAILABLE_DROPPABLE_ID });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded border border-dashed p-2 min-h-[120px] max-h-[380px] overflow-y-auto space-y-1 transition-colors",
        isOver
          ? "border-neutral-300 bg-neutral-100/50"
          : "border-neutral-200 bg-neutral-50/50",
      )}
    >
      {availableColumns.map((col) => (
        <DraggableAvailableColumn
          key={col}
          columnName={col}
          isDragging={activeId === `available-${col}`}
        />
      ))}
      {availableColumns.length === 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center">
          All columns added
        </p>
      )}
    </div>
  );
}

function DraggableAvailableColumn({
  columnName,
  isDragging,
}: {
  columnName: string;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `available-${columnName}`,
  });
  // When dragging, hide source so only DragOverlay is visible (no double preview)
  const style = isDragging
    ? undefined
    : transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded bg-white border py-1.5 px-2 text-sm cursor-grab active:cursor-grabbing shadow-sm",
        isDragging && "opacity-0 pointer-events-none",
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="truncate font-mono text-xs">{columnName}</span>
    </div>
  );
}

function DroppableSelectedColumns({
  columns,
  columnMetadata,
  updateConfig,
  activeId,
  layout = "single",
}: {
  columns: string[];
  columnMetadata: Record<string, { displayName?: string }>;
  updateConfig: (
    updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig,
  ) => void;
  activeId: string | null;
  layout?: "single" | "twoColumn";
}) {
  const { setNodeRef, isOver } = useDroppable({ id: SELECTED_DROPPABLE_ID });
  const columnIds = useMemo(() => columns.map((c) => `col-${c}`), [columns]);
  const isTwoColumn = layout === "twoColumn";
  const isDraggingFromAvailable =
    activeId != null && String(activeId).startsWith("available-");

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded border min-h-[120px] p-2 transition-all duration-150",
        isOver
          ? "border-2 border-primary bg-primary/10 ring-2 ring-primary/20"
          : "border-neutral-200 bg-white",
      )}
    >
      {columns.length === 0 ? (
        <p
          className={cn(
            "text-xs py-6 text-center transition-colors",
            isOver && isDraggingFromAvailable
              ? "text-primary font-medium"
              : "text-muted-foreground",
          )}
        >
          {isOver && isDraggingFromAvailable
            ? "Drop here to add column"
            : "Drop columns here"}
        </p>
      ) : (
        <SortableContext
          items={columnIds}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={cn(
              "gap-1.5",
              isTwoColumn ? "grid grid-cols-2" : "flex flex-col",
            )}
          >
            {columns.map((col) => (
              <SortableColumnRow
                key={col}
                id={`col-${col}`}
                columnName={col}
                displayName={columnMetadata[col]?.displayName}
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
                onRemove={() =>
                  updateConfig((prev) => {
                    const nextColumns = prev.columns.filter((c) => c !== col);
                    const nextMeta = Object.fromEntries(
                      Object.entries(prev.columnMetadata ?? {}).filter(
                        ([k]) => k !== col,
                      ),
                    );
                    const nextGroups = (prev.columnGroups ?? [])
                      .map((g) => ({
                        ...g,
                        columnNames: g.columnNames.filter((c) => c !== col),
                      }))
                      .filter((g) => g.columnNames.length > 0);
                    return {
                      ...prev,
                      columns: nextColumns,
                      columnMetadata: nextMeta,
                      columnGroups: nextGroups,
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

function GroupLabelRow({
  groupIndex,
  label,
  updateGroup,
  removeGroup,
  columns,
  columnNamesInGroup,
  toggleColumnInGroup,
}: {
  groupIndex: number;
  label: string;
  updateGroup: (
    index: number,
    updater: (g: InspectorColumnGroup) => InspectorColumnGroup,
  ) => void;
  removeGroup: (index: number) => void;
  columns: string[];
  columnNamesInGroup: string[];
  toggleColumnInGroup: (groupIndex: number, columnName: string) => void;
}) {
  const [localLabel, setLocalLabel] = useState(label);
  useEffect(() => setLocalLabel(label), [label]);
  const debouncedUpdateLabel = useDebouncedCallback(
    (value: string) =>
      updateGroup(groupIndex, (prev) => ({ ...prev, label: value })),
    300,
  );

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={localLabel}
          onChange={(e) => {
            const v = e.target.value;
            setLocalLabel(v);
            debouncedUpdateLabel(v);
          }}
          placeholder="Group label"
          className="h-8 flex-1"
        />
        <button
          type="button"
          onClick={() => removeGroup(groupIndex)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Remove
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {columns.map((col) => {
          const inGroup = columnNamesInGroup.includes(col);
          return (
            <button
              type="button"
              key={col}
              onClick={() => toggleColumnInGroup(groupIndex, col)}
              className={cn(
                "rounded px-2 py-0.5 text-xs border",
                inGroup
                  ? "bg-primary/10 border-primary/30"
                  : "border-transparent hover:bg-neutral-100",
              )}
            >
              {col}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColumnGroupsEditor({
  config,
  updateConfig,
}: {
  config: InspectorBoundaryConfig;
  updateConfig: (
    updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig,
  ) => void;
}) {
  const groups = config.columnGroups ?? [];
  const columns = config.columns;

  const addGroup = useCallback(() => {
    const id = uuidv4();
    updateConfig((prev) => ({
      ...prev,
      columnGroups: [
        ...(prev.columnGroups ?? []),
        { id, label: "New group", columnNames: [] },
      ],
    }));
  }, [updateConfig]);

  const updateGroup = useCallback(
    (
      index: number,
      updater: (g: InspectorColumnGroup) => InspectorColumnGroup,
    ) => {
      updateConfig((prev) => {
        const next = [...(prev.columnGroups ?? [])];
        if (!next[index]) return prev;
        next[index] = updater(next[index]);
        return { ...prev, columnGroups: next };
      });
    },
    [updateConfig],
  );

  const removeGroup = useCallback(
    (index: number) => {
      updateConfig((prev) => {
        const next = (prev.columnGroups ?? []).filter((_, i) => i !== index);
        return { ...prev, columnGroups: next };
      });
    },
    [updateConfig],
  );

  const toggleColumnInGroup = useCallback(
    (groupIndex: number, columnName: string) => {
      updateGroup(groupIndex, (g) => {
        const has = g.columnNames.includes(columnName);
        const columnNames = has
          ? g.columnNames.filter((c) => c !== columnName)
          : [...g.columnNames, columnName];
        return { ...g, columnNames };
      });
    },
    [updateGroup],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground">Column groups</Label>
        <button
          type="button"
          onClick={addGroup}
          className="text-xs text-primary hover:underline"
        >
          Add group
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Group columns under headings in the inspector.
      </p>
      <div className="flex flex-col gap-3">
        {groups.map((g, i) => (
          <GroupLabelRow
            key={g.id}
            groupIndex={i}
            label={g.label}
            updateGroup={updateGroup}
            removeGroup={removeGroup}
            columns={columns}
            columnNamesInGroup={g.columnNames}
            toggleColumnInGroup={toggleColumnInGroup}
          />
        ))}
      </div>
    </div>
  );
}
