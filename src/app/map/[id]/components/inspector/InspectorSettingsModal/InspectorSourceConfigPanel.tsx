"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, LayoutList, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/services/trpc/react";
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
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import {
  getAllColumnsSorted,
  getColumnOrderState,
  normalizeInspectorBoundaryConfig,
} from "../inspectorColumnOrder";
import {
  INSPECTOR_COLOR_OPTIONS,
  INSPECTOR_ICON_OPTIONS,
} from "../inspectorPanelOptions";
import { ColumnsSection } from "./ColumnsSection";
import { DEFAULT_SELECT_VALUE, inferFormat } from "./constants";
import type { InspectorLayout } from "./constants";
import type { useMapViews } from "../../../hooks/useMapViews";
import type { DataSource } from "@/server/models/DataSource";
import type {
  DefaultInspectorBoundaryConfig,
  InspectorBoundaryConfig,
} from "@/server/models/MapView";

export type ReadableDataSource = DataSource & { isOwner?: boolean };

function toDefaultConfig(
  config: InspectorBoundaryConfig,
): DefaultInspectorBoundaryConfig {
  const { id: _unusedId, dataSourceId: _unusedDsId, ...rest } = config;
  void _unusedId;
  void _unusedDsId;
  return rest;
}

export function InspectorSourceConfigPanel({
  dataSource,
  config,
  onAddToInspector,
  isInInspector,
  getLatestView,
  updateView,
}: {
  dataSource: ReadableDataSource;
  config: InspectorBoundaryConfig | null;
  onAddToInspector: () => void;
  isInInspector: boolean;
  getLatestView: ReturnType<typeof useMapViews>["getLatestView"];
  updateView: ReturnType<typeof useMapViews>["updateView"];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutateAsync: saveAsDefault } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.dataSource.listReadable.queryKey(),
        });
        toast.success("Default inspector settings updated.");
      },
      onError: (err) => {
        toast.error(
          err.message ?? "Failed to save as default inspector settings.",
        );
      },
    }),
  );
  const debouncedSaveAsDefault = useDebouncedCallback(
    (cfg: InspectorBoundaryConfig) => {
      if (!dataSource.isOwner) return;
      saveAsDefault({
        dataSourceId: dataSource.id,
        defaultInspectorConfig: toDefaultConfig(cfg),
      });
    },
    1500,
  );
  const columns = config?.columns ?? [];
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
    () => getColumnOrderState(config, allColumnNames),
    [config, allColumnNames],
  );

  const updateConfig = useCallback(
    (updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig) => {
      if (!config) return;
      const latestView = getLatestView();
      if (!latestView?.inspectorConfig?.boundaries) return;
      const boundaries = latestView.inspectorConfig.boundaries;
      const index = boundaries.findIndex((c) => c.id === config.id);
      if (index < 0) return;
      const updated = updater(boundaries[index]);
      const normalized =
        normalizeInspectorBoundaryConfig(updated, allColumnNames) ?? updated;
      const next = [...boundaries];
      next[index] = normalized;
      updateView({
        ...latestView,
        inspectorConfig: { ...latestView.inspectorConfig, boundaries: next },
      });
      if (dataSource.isOwner) debouncedSaveAsDefault(normalized);
    },
    [
      config,
      dataSource.isOwner,
      debouncedSaveAsDefault,
      getLatestView,
      updateView,
      allColumnNames,
    ],
  );

  const [displayName, setDisplayName] = useState(config?.name ?? "");
  useEffect(() => setDisplayName(config?.name ?? ""), [config?.name]);
  const debouncedUpdateName = useDebouncedCallback(
    (value: string) => updateConfig((prev) => ({ ...prev, name: value })),
    600,
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
        <div className="grid xl:grid-cols-4 grid-cols-2 gap-4 border-b pb-6">
          <div className="space-y-2 w-full min-w-0">
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
          config={config}
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
      </div >
    </div >
  );
}
