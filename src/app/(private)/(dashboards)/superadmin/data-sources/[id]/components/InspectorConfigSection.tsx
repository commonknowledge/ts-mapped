"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChartBarBigIcon,
  GripVertical,
  LayoutGrid,
  LayoutList,
  MoreHorizontalIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ColumnMetadataIcons from "@/app/(private)/map/[id]/components/ColumnMetadataIcons";
import {
  DEFAULT_BAR_COLOR_VALUE,
  INSPECTOR_BAR_COLOR_OPTIONS,
  INSPECTOR_COLOR_OPTIONS,
  SMART_MATCH_BAR_COLOR_VALUE,
} from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { useDataSourceColumn } from "@/app/(private)/map/[id]/hooks/useDataSourceColumn";
import { useInspectorColumn } from "@/app/(private)/map/[id]/hooks/useInspectorColumn";
import { NULL_UUID } from "@/constants";
import { ColumnDisplayFormatLabels, ColumnSemanticTypeLabels } from "@/labels";
import { ColumnSemanticType, ColumnType } from "@/models/DataSource";
import {
  ColumnDisplayFormat,
  InspectorComparisonStat,
  columnDisplayFormats,
} from "@/models/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import ColumnFormatPicker from "./ColumnFormatPicker";
import { DefaultInspectorPreview } from "./DefaultInspectorPreview";
import type {
  ColumnDef,
  ColumnMetadata,
  DefaultInspectorConfig,
} from "@/models/DataSource";
import type { InspectorItem } from "@/models/shared";
import type { ReactNode } from "react";

type InspectorLayout = "single" | "twoColumn";

function isDivider(
  item: InspectorItem,
): item is Extract<InspectorItem, { type: "divider" }> {
  return item.type === "divider";
}

type ChartRole = "start" | "member" | "end";

const makeChartEnd = (): InspectorItem => ({
  type: "divider",
  id: uuidv4(),
  label: "",
  display: "chartEnd",
});

const isChartEnd = (item: InspectorItem | undefined) =>
  item?.type === "divider" && item.display === "chartEnd";

/** The index of the next divider after `index`, or -1 */
const nextDividerIndex = (items: InspectorItem[], index: number) =>
  items.findIndex((item, i) => i > index && item.type === "divider");

/** Closes the chart started by divider `id` where its group ends, unless an
 *  end marker already closes it */
function withChartEnd(items: InspectorItem[], id: string) {
  const start = items.findIndex((i) => isDivider(i) && i.id === id);
  if (start === -1) return items;
  const next = nextDividerIndex(items, start);
  if (next !== -1 && isChartEnd(items[next])) return items;
  const at = next === -1 ? items.length : next;
  return [...items.slice(0, at), makeChartEnd(), ...items.slice(at)];
}

/** Removes the end marker closing the chart started by divider `id` */
function withoutChartEnd(items: InspectorItem[], id: string) {
  const start = items.findIndex((i) => isDivider(i) && i.id === id);
  const next = start === -1 ? -1 : nextDividerIndex(items, start);
  return next !== -1 && isChartEnd(items[next])
    ? items.filter((_, i) => i !== next)
    : items;
}

function getSortableId(item: InspectorItem): string {
  return isDivider(item) ? `div:${item.id}` : `col:${item.name}`;
}

function getItemKey(item: InspectorItem): string {
  return isDivider(item) ? `div-${item.id}` : `col-${item.name}`;
}

function inferDisplayFormatFromColumnName(
  colName: string,
): ColumnDisplayFormat | undefined {
  const normalised = colName.trim().toLowerCase();
  if (normalised.includes("%") || normalised.includes("percentage")) {
    return ColumnDisplayFormat.Percentage;
  }
  if (normalised.endsWith("?")) {
    return ColumnDisplayFormat.Boolean;
  }
  if (/\b(notes?|description|summary)\b/.test(normalised)) {
    return ColumnDisplayFormat.LargeText;
  }
  return undefined;
}

interface InspectorConfigSectionProps {
  dataSourceId: string;
  columnDefs: ColumnDef[];
  config: DefaultInspectorConfig;
  onChange: (patch: Partial<DefaultInspectorConfig>) => void;
  onPatchColumnMetadata: (
    column: string,
    patch: Partial<Omit<ColumnMetadata, "name">>,
  ) => void;
  /** Stacked for narrow panels, without the preview: the light editor's
   *  flyout sits beside the real inspector */
  compact?: boolean;
  /** Shown under the Columns heading in the compact layout, e.g. auto-scan */
  columnsHeader?: ReactNode;
}

export function InspectorConfigSection({
  dataSourceId,
  columnDefs,
  config,
  onChange,
  onPatchColumnMetadata,
  compact = false,
  columnsHeader,
}: InspectorConfigSectionProps) {
  const items = useMemo(() => config.items ?? [], [config.items]);
  const layout: InspectorLayout = config.layout ?? "single";
  const color = config.color ?? null;

  const allColumnNames = useMemo(
    () => columnDefs.map((c) => c.name),
    [columnDefs],
  );

  const selectedColumnNames = useMemo(
    () =>
      items
        .filter(
          (i): i is Extract<InspectorItem, { type: "column" }> =>
            i.type === "column",
        )
        .map((i) => i.name),
    [items],
  );

  const availableColumns = useMemo(
    () => allColumnNames.filter((n) => !selectedColumnNames.includes(n)),
    [allColumnNames, selectedColumnNames],
  );

  const handleAddColumn = useCallback(
    (colName: string) => {
      onChange({
        items: [
          ...items,
          {
            type: "column",
            name: colName,
            displayFormat: inferDisplayFormatFromColumnName(colName),
          },
        ],
      });
    },
    [items, onChange],
  );

  const handleRemoveColumn = useCallback(
    (colName: string) => {
      onChange({
        items: items.filter(
          (i) => !(i.type === "column" && i.name === colName),
        ),
      });
    },
    [items, onChange],
  );

  const handleAddAll = useCallback(() => {
    const newItems = availableColumns.map((n): InspectorItem => ({
      type: "column",
      name: n,
      displayFormat: inferDisplayFormatFromColumnName(n),
    }));
    onChange({ items: [...items, ...newItems] });
  }, [items, availableColumns, onChange]);

  const handleRemoveAll = useCallback(() => {
    onChange({ items: items.filter((i) => isDivider(i)) });
  }, [items, onChange]);

  const handleAddDivider = useCallback(() => {
    onChange({
      items: [...items, { type: "divider", id: uuidv4(), label: "" }],
    });
  }, [items, onChange]);

  // A divider whose columns show as one sorted bar chart; drag columns
  // under it to add them
  // Charts made before end markers existed get one where their group stops
  useEffect(() => {
    const ended = items.reduce(
      (list, item) =>
        isDivider(item) && item.display === "barChart"
          ? withChartEnd(list, item.id)
          : list,
      items,
    );
    if (ended !== items) onChange({ items: ended });
  }, [items, onChange]);

  const handleAddBarChart = useCallback(() => {
    onChange({
      items: [
        ...items,
        { type: "divider", id: uuidv4(), label: "Chart", display: "barChart" },
        makeChartEnd(),
      ],
    });
  }, [items, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const sortableIds = useMemo(() => items.map(getSortableId), [items]);

  const handleDragEnd = useCallback(
    (event: { active: { id: unknown }; over: { id: unknown } | null }) => {
      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;
      if (!overId || activeId === overId) return;

      const oldIndex = sortableIds.indexOf(activeId);
      const newIndex = sortableIds.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;

      onChange({ items: arrayMove(items, oldIndex, newIndex) });
    },
    [items, onChange, sortableIds],
  );

  const handleUpdateColumnItem = useCallback(
    (
      colName: string,
      patch: Partial<Extract<InspectorItem, { type: "column" }>>,
    ) => {
      onChange({
        items: items.map((i) =>
          i.type === "column" && i.name === colName ? { ...i, ...patch } : i,
        ),
      });
    },
    [items, onChange],
  );

  const handleUpdateDivider = useCallback(
    (
      id: string,
      patch: { label?: string; display?: "list" | "barChart" | "chartEnd" },
    ) => {
      const updated = items.map((i) =>
        isDivider(i) && i.id === id ? { ...i, ...patch } : i,
      );
      // A divider becoming a chart gets an end marker; one stopping drops it
      if (patch.display === "barChart") {
        onChange({ items: withChartEnd(updated, id) });
      } else if (patch.display === "list") {
        onChange({ items: withoutChartEnd(updated, id) });
      } else {
        onChange({ items: updated });
      }
    },
    [items, onChange],
  );

  const handleRemoveDivider = useCallback(
    (id: string) => {
      // A chart goes with its end marker
      onChange({
        items: withoutChartEnd(items, id).filter(
          (i) => !(isDivider(i) && i.id === id),
        ),
      });
    },
    [items, onChange],
  );

  // Where each row sits in a chart: its divider, its columns and its end
  // marker, all tinted together
  const chartRoles = useMemo(() => {
    const roles = new Map<string, { role: ChartRole; label: string }>();
    let chart: string | null = null;
    for (const item of items) {
      const key = getSortableId(item);
      if (isDivider(item) && item.display === "barChart") {
        chart = item.label;
        roles.set(key, { role: "start", label: item.label });
      } else if (isDivider(item) && item.display === "chartEnd") {
        if (chart !== null) roles.set(key, { role: "end", label: chart });
        chart = null;
      } else if (isDivider(item)) {
        chart = null;
      } else if (chart !== null) {
        roles.set(key, { role: "member", label: chart });
      }
    }
    return roles;
  }, [items]);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 min-h-0",
        compact ? "flex-col" : "gap-6 h-[80vh]",
      )}
    >
      <div
        className={cn(
          "flex-1 min-w-0 flex flex-col min-h-0",
          compact ? "gap-3" : "rounded-lg border border-neutral-200 p-6 gap-6",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-2",
            compact
              ? "gap-2 [&_label]:text-[11px] [&_label]:font-normal [&>div]:space-y-1"
              : "gap-4",
          )}
        >
          <div className="space-y-2 w-full min-w-0">
            <Label className="text-muted-foreground">Colour</Label>
            <Select
              value={color ?? NULL_UUID}
              onValueChange={(value) =>
                onChange({
                  color: value === NULL_UUID ? null : value,
                })
              }
            >
              <SelectTrigger
                className={cn(
                  "w-full min-w-0 truncate",
                  compact ? "h-8 text-xs" : "h-9",
                )}
              >
                <SelectValue placeholder="Default" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTOR_COLOR_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value || "default"}
                    value={opt.value || NULL_UUID}
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
          <div className="space-y-2 w-full min-w-0">
            <Label className="text-muted-foreground">Layout</Label>
            <Select
              value={layout}
              onValueChange={(value: InspectorLayout) =>
                onChange({ layout: value })
              }
            >
              <SelectTrigger
                className={cn(
                  "w-full min-w-0 truncate",
                  compact ? "h-8 text-xs" : "h-9",
                )}
              >
                <SelectValue placeholder="Layout" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">
                  <span className="flex items-center gap-2">
                    <LayoutList className="w-4 h-4 shrink-0 text-muted-foreground" />
                    Single column
                  </span>
                </SelectItem>
                <SelectItem value="twoColumn">
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 shrink-0 text-muted-foreground" />
                    Two-column grid
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {compact ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground">
                Columns
                <span className="font-normal text-neutral-400">
                  {selectedColumnNames.length}
                </span>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Column actions"
                  className="cursor-pointer rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <MoreHorizontalIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleAddDivider}>
                    Add divider
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddBarChart}>
                    Add bar chart
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={availableColumns.length === 0}
                    onClick={handleAddAll}
                  >
                    Add all columns
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={selectedColumnNames.length === 0}
                    onClick={handleRemoveAll}
                  >
                    Remove all columns
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {columnsHeader}
            <div className="rounded-md border border-neutral-200 bg-white">
              {items.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">
                  No columns selected
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sortableIds}>
                    {items.map((item) => (
                      <SortableSelectedRow
                        key={getItemKey(item)}
                        id={getSortableId(item)}
                        item={item}
                        dataSourceId={dataSourceId}
                        compact
                        chartRole={chartRoles.get(getSortableId(item))?.role}
                        chartLabel={chartRoles.get(getSortableId(item))?.label}
                        onUpdateColumn={handleUpdateColumnItem}
                        onRemoveColumn={handleRemoveColumn}
                        onUpdateDivider={handleUpdateDivider}
                        onRemoveDivider={handleRemoveDivider}
                        onPatchColumnMetadata={onPatchColumnMetadata}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
            <AddColumnPicker
              columns={availableColumns}
              onAdd={handleAddColumn}
            />
          </div>
        ) : (
          <>
            {/* Column management */}
            <div className="flex flex-col gap-3 min-h-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-muted-foreground">Columns</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddAll}
                    disabled={availableColumns.length === 0}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    Add all
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAll}
                    disabled={selectedColumnNames.length === 0}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    Remove all
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDivider}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Add divider
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  "gap-4 min-h-0 flex-1",
                  compact ? "flex flex-col" : "grid grid-cols-2",
                )}
              >
                {/* Available columns */}
                <div
                  className={cn("space-y-1 min-h-0", compact && "order-last")}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Available ({availableColumns.length})
                  </p>
                  <div
                    className={cn(
                      "border border-neutral-200 rounded-md overflow-y-auto min-h-0",
                      compact ? "max-h-72 bg-white" : "h-full",
                    )}
                  >
                    {availableColumns.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">
                        All columns selected
                      </p>
                    ) : (
                      availableColumns.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleAddColumn(col)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0 truncate"
                          title={col}
                        >
                          + {col}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected items */}
                <div className="space-y-1 min-h-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selected ({selectedColumnNames.length})
                  </p>
                  <div
                    className={cn(
                      "border border-neutral-200 rounded-md overflow-y-auto min-h-0",
                      compact ? "max-h-72 bg-white" : "h-full",
                    )}
                  >
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">
                        No columns selected
                      </p>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext items={sortableIds}>
                          {items.map((item) => (
                            <SortableSelectedRow
                              key={getItemKey(item)}
                              id={getSortableId(item)}
                              item={item}
                              dataSourceId={dataSourceId}
                              onUpdateColumn={(name, patch) =>
                                handleUpdateColumnItem(name, patch)
                              }
                              onRemoveColumn={(name) =>
                                handleRemoveColumn(name)
                              }
                              onUpdateDivider={handleUpdateDivider}
                              onRemoveDivider={(id) => handleRemoveDivider(id)}
                              onPatchColumnMetadata={(col, patch) =>
                                onPatchColumnMetadata(col, patch)
                              }
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {!compact && (
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{ width: "320px", minWidth: "280px" }}
        >
          <DefaultInspectorPreview
            dataSourceId={dataSourceId}
            className="h-full min-h-[200px]"
          />
        </div>
      )}
    </div>
  );
}

function SortableSelectedRow({
  id,
  item,
  dataSourceId,
  onUpdateColumn,
  onRemoveColumn,
  onUpdateDivider,
  onRemoveDivider,
  onPatchColumnMetadata,
  compact = false,
  chartRole,
  chartLabel,
}: {
  id: string;
  item: InspectorItem;
  dataSourceId: string;
  compact?: boolean;
  /** Its place in a bar chart group, which tints it */
  chartRole?: ChartRole;
  /** The chart's name, for its end marker */
  chartLabel?: string;
  onUpdateColumn: (
    name: string,
    patch: Partial<Extract<InspectorItem, { type: "column" }>>,
  ) => void;
  onRemoveColumn: (name: string) => void;
  onUpdateDivider: (
    id: string,
    patch: { label?: string; display?: "list" | "barChart" | "chartEnd" },
  ) => void;
  onRemoveDivider: (id: string) => void;
  onPatchColumnMetadata: (
    column: string,
    patch: Partial<Omit<ColumnMetadata, "name">>,
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 border-b border-neutral-100 last:border-0",
        compact ? "py-1.5" : "py-1",
        chartRole && "bg-sky-50/70",
        isDragging && "bg-neutral-50",
      )}
    >
      <button
        type="button"
        className={cn(
          "shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing",
          "p-1 -ml-1",
        )}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isDivider(item) && item.display === "chartEnd" ? (
        // Drag it to take in more columns, or fewer; it goes with its chart
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[11px] text-sky-700">
          <span className="shrink-0">
            {chartLabel === undefined
              ? "End of chart"
              : /chart$/i.test(chartLabel.trim())
                ? `End of ${chartLabel.trim()}`
                : `End of ${chartLabel.trim() || "the"} chart`}
          </span>
          <span
            aria-hidden
            className="h-px flex-1 border-t border-dashed border-sky-300"
          />
        </span>
      ) : isDivider(item) ? (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs text-muted-foreground shrink-0">——</span>
          <input
            className="flex-1 min-w-0 text-xs border border-input rounded px-1.5 py-0.5"
            value={item.label}
            placeholder="Divider label"
            onChange={(e) =>
              onUpdateDivider(item.id, { label: e.target.value })
            }
          />
          <button
            type="button"
            onClick={() =>
              onUpdateDivider(item.id, {
                display: item.display === "barChart" ? "list" : "barChart",
              })
            }
            aria-pressed={item.display === "barChart"}
            aria-label="Show the columns below as a bar chart"
            title={
              item.display === "barChart"
                ? "Columns below show as a bar chart, largest first. Click for rows"
                : "Show the columns below as a bar chart, largest first"
            }
            className={cn(
              "shrink-0 cursor-pointer rounded p-1 hover:bg-neutral-100",
              item.display === "barChart"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-400 hover:text-neutral-900",
            )}
          >
            <ChartBarBigIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveDivider(item.id)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            ✕
          </button>
        </div>
      ) : (
        <ColumnItemRow
          dataSourceId={dataSourceId}
          name={item.name}
          compact={compact}
          onUpdate={(patch) => onUpdateColumn(item.name, patch)}
          onRemove={() => onRemoveColumn(item.name)}
          onPatchColumnMetadata={(patch) =>
            onPatchColumnMetadata(item.name, patch)
          }
        />
      )}
    </div>
  );
}

// Formats with their own settings (value range, bar colour, scale maximum,
// comparison stat), opened as soon as one is chosen
const FORMATS_WITH_OPTIONS: (ColumnDisplayFormat | undefined)[] = [
  ColumnDisplayFormat.Percentage,
  ColumnDisplayFormat.Scale,
  ColumnDisplayFormat.NumberWithComparison,
];

const numericOnlyFormats: ColumnDisplayFormat[] = [
  ColumnDisplayFormat.Number,
  ColumnDisplayFormat.Percentage,
  ColumnDisplayFormat.Scale,
  ColumnDisplayFormat.NumberWithComparison,
];

function ColumnItemRow({
  dataSourceId,
  name,
  onUpdate,
  onRemove,
  onPatchColumnMetadata,
  compact = false,
}: {
  dataSourceId: string;
  name: string;
  compact?: boolean;
  onUpdate: (
    patch: Partial<Extract<InspectorItem, { type: "column" }>>,
  ) => void;
  onRemove: () => void;
  onPatchColumnMetadata?: (
    patch: Partial<Omit<ColumnMetadata, "name">>,
  ) => void;
}) {
  const { columnDef, columnMetadata } = useDataSourceColumn(dataSourceId, name);
  const inspectorColumn = useInspectorColumn(dataSourceId, name);
  const isNumeric = columnDef?.type === ColumnType.Number;
  const availableFormats = isNumeric
    ? columnDisplayFormats
    : columnDisplayFormats.filter((f) => !numericOnlyFormats.includes(f));

  const formatSelect = (
    <select
      className="h-6 rounded border border-input bg-background px-1.5 text-xs"
      aria-label="Display format"
      value={inspectorColumn?.displayFormat ?? ""}
      onChange={(e) =>
        onUpdate({
          displayFormat: e.target.value
            ? (e.target.value as ColumnDisplayFormat)
            : undefined,
        })
      }
    >
      <option value="">Default format</option>
      {availableFormats.map((f) => (
        <option key={f} value={f}>
          {ColumnDisplayFormatLabels[f]}
        </option>
      ))}
    </select>
  );

  const format = inspectorColumn?.displayFormat;
  const hasBar =
    format === ColumnDisplayFormat.Percentage ||
    format === ColumnDisplayFormat.Scale;
  const isPinned = Boolean(inspectorColumn?.pinned);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const controlClassName =
    "h-6 rounded border border-input bg-background px-1.5 text-xs";

  const rangeSelect = format === ColumnDisplayFormat.Percentage &&
    onPatchColumnMetadata && (
      <select
        className={controlClassName}
        title="How the values are stored"
        aria-label="How the values are stored"
        value={columnMetadata?.semanticType ?? ""}
        onChange={(e) =>
          onPatchColumnMetadata({
            semanticType: e.target.value
              ? (e.target.value as ColumnSemanticType)
              : undefined,
          })
        }
      >
        <option value="">
          {compact ? "Work it out" : "Infer from values"}
        </option>
        {[
          ColumnSemanticType.Percentage01,
          ColumnSemanticType.Percentage0100,
        ].map((s) => (
          <option key={s} value={s}>
            {ColumnSemanticTypeLabels[s]}
          </option>
        ))}
      </select>
    );

  const colourSelect = inspectorColumn && hasBar && (
    <select
      className={controlClassName}
      title="Bar colour"
      aria-label="Bar colour"
      value={inspectorColumn.barColor ?? DEFAULT_BAR_COLOR_VALUE}
      onChange={(e) => onUpdate({ barColor: e.target.value })}
    >
      {INSPECTOR_BAR_COLOR_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {compact && o.value === SMART_MATCH_BAR_COLOR_VALUE
            ? "Party colours"
            : o.label}
        </option>
      ))}
    </select>
  );

  const scaleInput = format === ColumnDisplayFormat.Scale && (
    <input
      type="number"
      min={2}
      max={10}
      className={cn(controlClassName, "w-16")}
      placeholder="Max"
      aria-label="Scale maximum"
      value={inspectorColumn?.scaleMax ?? ""}
      onChange={(e) =>
        onUpdate({
          scaleMax: e.target.value ? Number(e.target.value) : undefined,
        })
      }
    />
  );

  const comparisonSelect = format ===
    ColumnDisplayFormat.NumberWithComparison && (
    <select
      className={controlClassName}
      aria-label="Compare with"
      value={inspectorColumn?.comparisonStat ?? ""}
      onChange={(e) =>
        onUpdate({
          comparisonStat: e.target.value
            ? (e.target.value as InspectorComparisonStat)
            : undefined,
        })
      }
    >
      <option value="">Comparison stat</option>
      {Object.values(InspectorComparisonStat).map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );

  const options = [
    { label: "Values", control: rangeSelect },
    { label: "Colour", control: colourSelect },
    { label: "Out of", control: scaleInput },
    { label: "Compare with", control: comparisonSelect },
  ].filter((o) => o.control);

  if (compact) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span
            className="flex-1 min-w-0 truncate text-xs font-medium"
            title={name}
          >
            {name}
          </span>
          <button
            type="button"
            onClick={() => onUpdate({ pinned: !isPinned })}
            aria-pressed={isPinned}
            aria-label={isPinned ? "Unpin from the top" : "Pin to the top"}
            title={
              isPinned
                ? "Pinned as a key figure. Click to unpin"
                : "Pin as a key figure at the top"
            }
            className={cn(
              "shrink-0 cursor-pointer rounded p-1 hover:bg-neutral-100",
              isPinned
                ? "text-neutral-900"
                : "text-neutral-300 hover:text-neutral-700",
            )}
          >
            <PinIcon className={cn("size-3.5", isPinned && "fill-current")} />
          </button>
          <ColumnFormatPicker
            value={format}
            formats={availableFormats}
            onChange={(next) => {
              onUpdate({ displayFormat: next });
              // A format with settings opens them straight away
              setOptionsOpen(FORMATS_WITH_OPTIONS.includes(next));
            }}
          />
          <button
            type="button"
            onClick={() => setOptionsOpen(!optionsOpen)}
            disabled={options.length === 0}
            aria-expanded={optionsOpen}
            aria-label="Format options"
            title="Format options"
            className={cn(
              "shrink-0 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 disabled:invisible",
              optionsOpen && "bg-neutral-100 text-neutral-900",
            )}
          >
            <SlidersHorizontalIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${name}`}
            title="Remove"
            className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
        {optionsOpen && options.length > 0 && (
          <div className="mt-1.5 mb-0.5 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 rounded-md bg-neutral-50 px-2 py-1.5">
            {options.map(({ label, control }) => (
              <label key={label} className="contents">
                <span className="text-[11px] text-neutral-500">{label}</span>
                <span className="min-w-0 [&>*]:max-w-full">{control}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 space-y-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm truncate flex-1 min-w-0" title={name}>
          {name}
          <ColumnMetadataIcons
            dataSourceId={dataSourceId}
            column={name}
            fields={{ description: true }}
          />
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {formatSelect}
        {rangeSelect}
        {colourSelect}
        {scaleInput}
        {comparisonSelect}
      </div>
    </div>
  );
}

// The compact layout's column list: a searchable picker instead of a
// second always-open list
function AddColumnPicker({
  columns,
  onAdd,
}: {
  columns: string[];
  onAdd: (column: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const matching = columns.filter((c) => c.toLowerCase().includes(query));

  if (columns.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Every column is shown.</p>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="-ml-1 flex w-fit cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <PlusIcon className="size-3.5" />
        Add a column
        <span className="text-neutral-400">({columns.length})</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col rounded-md border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-2">
        <SearchIcon className="size-3.5 shrink-0 text-neutral-400" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search columns"
          aria-label="Search columns"
          className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setSearch("");
          }}
          aria-label="Close column picker"
          className="cursor-pointer rounded p-0.5 text-neutral-400 hover:text-neutral-900"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto py-1">
        {matching.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            No columns match.
          </p>
        ) : (
          matching.map((column) => (
            <button
              key={column}
              type="button"
              onClick={() => onAdd(column)}
              title={column}
              className="flex w-full cursor-pointer items-center gap-1.5 truncate px-2 py-1 text-left text-xs hover:bg-neutral-50"
            >
              <PlusIcon className="size-3 shrink-0 text-neutral-400" />
              {column}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
