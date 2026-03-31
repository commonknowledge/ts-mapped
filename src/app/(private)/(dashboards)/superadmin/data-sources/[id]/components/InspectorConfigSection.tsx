"use client";

import { LayoutGrid, LayoutList } from "lucide-react";
import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import ColumnMetadataIcons from "@/app/(private)/map/[id]/components/ColumnMetadataIcons";
import { INSPECTOR_COLOR_OPTIONS } from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { useDataSourceColumn } from "@/app/(private)/map/[id]/hooks/useDataSourceColumn";
import { useInspectorColumn } from "@/app/(private)/map/[id]/hooks/useInspectorColumn";
import { NULL_UUID } from "@/constants";
import { ColumnSemanticTypeLabels } from "@/labels";
import { ColumnSemanticType, ColumnType } from "@/models/DataSource";
import {
  ColumnDisplayFormat,
  InspectorComparisonStat,
  columnDisplayFormats,
} from "@/models/shared";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { DefaultInspectorPreview } from "./DefaultInspectorPreview";
import type {
  ColumnDef,
  ColumnMetadata,
  DefaultInspectorConfig,
} from "@/models/DataSource";
import type { InspectorItem } from "@/models/shared";

type InspectorLayout = "single" | "twoColumn";

function isDivider(
  item: InspectorItem,
): item is { type: "divider"; id: string; label: string } {
  return item.type === "divider";
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
}

export function InspectorConfigSection({
  dataSourceId,
  columnDefs,
  config,
  onChange,
  onPatchColumnMetadata,
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
        items: [...items, { type: "column", name: colName }],
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
    const newItems = availableColumns.map(
      (n): InspectorItem => ({ type: "column", name: n }),
    );
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

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const next = [...items];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onChange({ items: next });
    },
    [items, onChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= items.length - 1) return;
      const next = [...items];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onChange({ items: next });
    },
    [items, onChange],
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
    (id: string, label: string) => {
      onChange({
        items: items.map((i) =>
          isDivider(i) && i.id === id ? { ...i, label } : i,
        ),
      });
    },
    [items, onChange],
  );

  const handleRemoveDivider = useCallback(
    (id: string) => {
      onChange({ items: items.filter((i) => !(isDivider(i) && i.id === id)) });
    },
    [items, onChange],
  );

  return (
    <div className="flex gap-6 w-full min-w-0">
      <div className="flex-1 min-w-0 rounded-lg border border-neutral-200 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
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
              <SelectTrigger className="h-9 w-full min-w-0 truncate">
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
              <SelectTrigger className="h-9 w-full min-w-0 truncate">
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

        {/* Column management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
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

          <div className="grid grid-cols-2 gap-4">
            {/* Available columns */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Available ({availableColumns.length})
              </p>
              <div className="border border-neutral-200 rounded-md max-h-64 overflow-y-auto">
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
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Selected ({selectedColumnNames.length})
              </p>
              <div className="border border-neutral-200 rounded-md max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">
                    No columns selected
                  </p>
                ) : (
                  items.map((item, index) => (
                    <div
                      key={
                        isDivider(item) ? `div-${item.id}` : `col-${item.name}`
                      }
                      className="flex items-center gap-1 px-2 py-1 border-b border-neutral-100 last:border-0"
                    >
                      <div className="flex flex-col shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none text-xs"
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === items.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none text-xs"
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </div>

                      {isDivider(item) ? (
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground shrink-0">
                            ——
                          </span>
                          <input
                            className="flex-1 min-w-0 text-xs border border-input rounded px-1.5 py-0.5"
                            value={item.label}
                            placeholder="Divider label"
                            onChange={(e) =>
                              handleUpdateDivider(item.id, e.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDivider(item.id)}
                            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <ColumnItemRow
                          dataSourceId={dataSourceId}
                          name={item.name}
                          onUpdate={(patch) =>
                            handleUpdateColumnItem(item.name, patch)
                          }
                          onRemove={() => handleRemoveColumn(item.name)}
                          onPatchColumnMetadata={(patch) =>
                            onPatchColumnMetadata(item.name, patch)
                          }
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="shrink-0 flex flex-col overflow-hidden"
        style={{ width: "320px", minWidth: "280px" }}
      >
        <DefaultInspectorPreview
          dataSourceId={dataSourceId}
          className="h-full min-h-[200px]"
        />
      </div>
    </div>
  );
}

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
}: {
  dataSourceId: string;
  name: string;
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
        <select
          className="h-6 rounded border border-input bg-background px-1.5 text-xs"
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
              {f}
            </option>
          ))}
        </select>

        {inspectorColumn?.displayFormat === ColumnDisplayFormat.Percentage &&
          onPatchColumnMetadata && (
            <select
              className="h-6 rounded border border-input bg-background px-1.5 text-xs"
              value={columnMetadata?.semanticType ?? ""}
              onChange={(e) =>
                onPatchColumnMetadata({
                  semanticType: e.target.value
                    ? (e.target.value as ColumnSemanticType)
                    : undefined,
                })
              }
            >
              <option value="">Infer from values</option>
              {[
                ColumnSemanticType.Percentage01,
                ColumnSemanticType.Percentage0100,
              ].map((s) => (
                <option key={s} value={s}>
                  {ColumnSemanticTypeLabels[s]}
                </option>
              ))}
            </select>
          )}

        {inspectorColumn?.displayFormat === ColumnDisplayFormat.Scale && (
          <input
            type="number"
            min={2}
            max={10}
            className="h-6 w-16 rounded border border-input bg-background px-1.5 text-xs"
            placeholder="Max"
            value={inspectorColumn?.scaleMax ?? ""}
            onChange={(e) =>
              onUpdate({
                scaleMax: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        )}

        {inspectorColumn?.displayFormat ===
          ColumnDisplayFormat.NumberWithComparison && (
          <select
            className="h-6 rounded border border-input bg-background px-1.5 text-xs"
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
        )}
      </div>
    </div>
  );
}
