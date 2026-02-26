"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  DefaultInspectorBoundaryConfig,
  InspectorBoundaryConfig,
} from "@/server/models/MapView";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import type { DataSource } from "@/server/models/DataSource";
import { ColumnsSection } from "@/app/map/[id]/components/inspector/InspectorSettingsModal/ColumnsSection";
import { DEFAULT_SELECT_VALUE } from "@/app/map/[id]/components/inspector/InspectorSettingsModal/constants";
import type { InspectorLayout } from "@/app/map/[id]/components/inspector/InspectorSettingsModal/constants";
import {
  getAllColumnsSorted,
  getColumnOrderState,
} from "@/app/map/[id]/components/inspector/inspectorColumnOrder";
import {
  INSPECTOR_COLOR_OPTIONS,
  INSPECTOR_ICON_OPTIONS,
} from "@/app/map/[id]/components/inspector/inspectorPanelOptions";
import { inferFormat } from "@/app/map/[id]/components/inspector/InspectorSettingsModal/constants";
import { DefaultInspectorPreview } from "./DefaultInspectorPreview";

const PLACEHOLDER_ID = "__default_inspector_edit__";

/** Dedupe array preserving order (first occurrence wins). */
function dedupeColumns(cols: string[]): string[] {
  const seen = new Set<string>();
  return cols.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

/** Dedupe columnItems: keep dividers, dedupe column names (first occurrence wins). */
function dedupeColumnItems(
  items: InspectorBoundaryConfig["columnItems"],
): InspectorBoundaryConfig["columnItems"] {
  if (!items?.length) return items;
  const seen = new Set<string>();
  return items.filter((i) => {
    if (typeof i === "string") {
      if (seen.has(i)) return false;
      seen.add(i);
      return true;
    }
    return true;
  });
}

function toEditingConfig(
  dataSourceId: string,
  defaultConfig: DefaultInspectorBoundaryConfig | null | undefined,
  dataSourceName: string,
): InspectorBoundaryConfig {
  if (!defaultConfig) {
    return {
      id: PLACEHOLDER_ID,
      dataSourceId,
      name: dataSourceName,
      type: InspectorBoundaryConfigType.Simple,
      columns: [],
      columnMetadata: undefined,
      columnGroups: undefined,
      layout: "single",
    };
  }
  const columns = dedupeColumns(defaultConfig.columns ?? []);
  const columnItems = dedupeColumnItems(defaultConfig.columnItems);
  return {
    id: PLACEHOLDER_ID,
    dataSourceId,
    name: defaultConfig.name,
    type: defaultConfig.type,
    columns,
    columnOrder: defaultConfig.columnOrder,
    columnItems,
    columnMetadata: defaultConfig.columnMetadata,
    columnGroups: defaultConfig.columnGroups,
    layout: defaultConfig.layout ?? "single",
    icon: defaultConfig.icon,
    color: defaultConfig.color,
  };
}

function toDefaultConfig(
  config: InspectorBoundaryConfig,
): DefaultInspectorBoundaryConfig {
  const { id: _id, dataSourceId: _dsId, ...rest } = config;
  return rest;
}

export function DefaultInspectorConfigSection({
  dataSource,
}: {
  dataSource: DataSource;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutateAsync: saveDefaultConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.dataSource.byId.queryKey({ dataSourceId: dataSource.id }),
        });
        toast.success("Default inspector settings saved.");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save default inspector settings.");
      },
    }),
  );

  const onSave = useCallback(
    async (config: DefaultInspectorBoundaryConfig) => {
      await saveDefaultConfig({
        dataSourceId: dataSource.id,
        defaultInspectorConfig: config,
      });
    },
    [dataSource.id, saveDefaultConfig],
  );

  const [localConfig, setLocalConfig] = useState<InspectorBoundaryConfig>(() =>
    toEditingConfig(
      dataSource.id,
      dataSource.defaultInspectorConfig,
      dataSource.name,
    ),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(toDefaultConfig(localConfig));
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [localConfig, onSave]);

  const handleCancel = useCallback(() => {
    setLocalConfig(
      toEditingConfig(
        dataSource.id,
        dataSource.defaultInspectorConfig,
        dataSource.name,
      ),
    );
    setIsDirty(false);
  }, [dataSource.id, dataSource.defaultInspectorConfig, dataSource.name]);

  const allColumnNames = useMemo(
    () => dataSource.columnDefs.map((c) => c.name),
    [dataSource.columnDefs],
  );
  const allColumnsSorted = useMemo(
    () => getAllColumnsSorted(allColumnNames),
    [allColumnNames],
  );
  const {
    allColumnsInOrder,
    selectedColumnsInOrder,
    selectedItemsInOrder,
    allItemsInOrder,
    availableColumns,
    availableIds,
    columnIds,
  } = useMemo(
    () => getColumnOrderState(localConfig, allColumnNames),
    [localConfig, allColumnNames],
  );

  const updateConfig = useCallback(
    (updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig) => {
      setLocalConfig((prev) => updater(prev));
      setIsDirty(true);
    },
    [],
  );

  const handleAddColumn = useCallback(
    (colName: string) => {
      if (!allColumnNames.includes(colName)) return;
      const inferred = inferFormat(colName);
      updateConfig((prev) => {
        if (prev.columns.includes(colName)) return prev;
        const order = prev.columnOrder?.filter((c) =>
          allColumnNames.includes(c),
        );
        const baseOrder =
          order?.length === allColumnNames.length ? order : allColumnsSorted;
        const newOrder = [...baseOrder.filter((c) => c !== colName), colName];
        const nextColumns = [...prev.columns, colName];
        const nextItems = prev.columnItems
          ? [...prev.columnItems, colName]
          : undefined;
        return {
          ...prev,
          columns: nextColumns,
          columnOrder: newOrder,
          ...(nextItems && { columnItems: nextItems }),
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
        const order = prev.columnOrder?.filter((c) =>
          allColumnNames.includes(c),
        );
        const baseOrder =
          order?.length === allColumnNames.length ? order : allColumnsSorted;
        const newOrder = [...baseOrder.filter((c) => c !== colName), colName];
        const nextItems = prev.columnItems?.filter((i) => i !== colName);
        return {
          ...prev,
          columns: nextColumns,
          columnOrder: newOrder,
          ...(nextItems !== undefined && { columnItems: nextItems }),
          columnMetadata: nextMeta,
        };
      });
    },
    [updateConfig, allColumnNames, allColumnsSorted],
  );

  const handleRemoveColumnFromRight = useCallback(
    (colName: string) => {
      updateConfig((prev) => {
        const nextColumns = prev.columns.filter((c) => c !== colName);
        const nextMeta = Object.fromEntries(
          Object.entries(prev.columnMetadata ?? {}).filter(
            ([k]) => k !== colName,
          ),
        );
        const newColumnOrder = [
          ...nextColumns,
          ...allColumnsInOrder.filter((c) => !nextColumns.includes(c)),
        ];
        const nextItems = prev.columnItems?.filter((i) => i !== colName);
        return {
          ...prev,
          columns: nextColumns,
          columnOrder: newColumnOrder,
          ...(nextItems !== undefined && { columnItems: nextItems }),
          columnMetadata: nextMeta,
        };
      });
    },
    [updateConfig, allColumnsInOrder],
  );

  const columnMetadata = localConfig.columnMetadata ?? {};
  const layout = (localConfig.layout ?? "single") as InspectorLayout;
  const panelIcon = localConfig.icon ?? undefined;
  const panelColor = localConfig.color ?? undefined;
  const columns = localConfig.columns ?? [];

  return (
    <div className="flex gap-6 w-full min-w-0">
      <div className="flex-1 min-w-0 rounded-lg border border-neutral-200 p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-1">
            Default inspector settings
          </h3>
          <p className="text-sm text-muted-foreground">
            These settings are saved automatically and used when this data source
            is added to the inspector on a map (yours or others’ if shared).
          </p>
        </div>
        <div className="grid xl:grid-cols-4 grid-cols-2 gap-4">
        <div className="space-y-2 w-full min-w-0">
          <Label className="text-muted-foreground">Display name</Label>
          <Input
            value={localConfig.name}
            onChange={(e) =>
              updateConfig((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Main data"
            className="max-w-sm"
          />
        </div>
        <div className="space-y-2 w-full min-w-0">
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
            <SelectTrigger className="h-9 w-full min-w-0 truncate">
              <SelectValue placeholder="Default" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {INSPECTOR_ICON_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value || "default"}
                  value={opt.value || DEFAULT_SELECT_VALUE}
                >
                  <span className="flex items-center gap-2 ">
                    <opt.Icon className="h-4 w-4 shrink-0" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 w-full min-w-0">
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
            <SelectTrigger className="h-9 w-full min-w-0 truncate">
              <SelectValue placeholder="Default" className="truncate" />
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
        <div className="space-y-2 w-full min-w-0">
          <Label className="text-muted-foreground">Layout</Label>
          <Select
            value={layout}
            onValueChange={(value: InspectorLayout) =>
              updateConfig((prev) => ({ ...prev, layout: value }))
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
      <ColumnsSection
        config={localConfig}
        allColumnsInOrder={allColumnsInOrder}
        selectedColumnsInOrder={selectedColumnsInOrder}
        selectedItemsInOrder={selectedItemsInOrder}
        allItemsInOrder={allItemsInOrder}
        availableColumns={availableColumns}
        availableIds={availableIds}
        columnIds={columnIds}
        columns={columns}
        columnMetadata={columnMetadata}
        updateConfig={updateConfig}
        handleAddColumn={handleAddColumn}
        handleRemoveColumn={handleRemoveColumn}
        handleRemoveColumnFromRight={handleRemoveColumnFromRight}
      />
        {isDirty && (
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel changes
            </Button>
          </div>
        )}
      </div>
      <div
        className="shrink-0 flex flex-col overflow-hidden"
        style={{ width: "320px", minWidth: "280px" }}
      >
        <DefaultInspectorPreview
          config={localConfig}
          dataSource={dataSource}
          className="h-full min-h-[200px]"
        />
      </div>
    </div>
  );
}
