"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAllColumnsSorted,
  getColumnOrderState,
  normalizeInspectorDataSourceConfig,
} from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorColumnOrder";
import { INSPECTOR_COLOR_OPTIONS } from "@/app/(private)/map/[id]/components/InspectorPanel/inspectorPanelOptions";
import { ColumnsSection } from "@/app/(private)/map/[id]/components/InspectorPanel/InspectorSettingsModal/ColumnsSection";
import {
  DEFAULT_SELECT_VALUE,
  inferFormat,
} from "@/app/(private)/map/[id]/components/InspectorPanel/InspectorSettingsModal/constants";
import {
  type DefaultInspectorDataSourceConfig,
  type InspectorDataSourceConfig,
  InspectorDataSourceConfigType,
} from "@/models/MapView";
import { useTRPC } from "@/services/trpc/react";
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
import type { InspectorLayout } from "@/app/(private)/map/[id]/components/InspectorPanel/InspectorSettingsModal/constants";
import type { DataSource } from "@/models/DataSource";

const PLACEHOLDER_ID = "__default_inspector_edit__";

function toEditingConfig(
  dataSourceId: string,
  defaultConfig: DefaultInspectorDataSourceConfig | null | undefined,
  dataSourceName: string,
): InspectorDataSourceConfig {
  if (!defaultConfig) {
    return {
      id: PLACEHOLDER_ID,
      dataSourceId,
      name: dataSourceName,
      type: InspectorDataSourceConfigType.Simple,
      columns: [],
      columnMetadata: undefined,
      columnGroups: undefined,
      layout: "single",
    };
  }
  return {
    id: PLACEHOLDER_ID,
    dataSourceId,
    name: defaultConfig.name,
    type: defaultConfig.type,
    columns: defaultConfig.columns ?? [],
    columnOrder: defaultConfig.columnOrder,
    columnItems: defaultConfig.columnItems,
    columnMetadata: defaultConfig.columnMetadata,
    columnGroups: defaultConfig.columnGroups,
    layout: defaultConfig.layout ?? "single",
    icon: defaultConfig.icon,
    color: defaultConfig.color,
  };
}

function toDefaultConfig(
  config: InspectorDataSourceConfig,
): DefaultInspectorDataSourceConfig {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, dataSourceId, ...rest } = config;
  return rest;
}

export function DefaultInspectorConfigSection({
  dataSource,
  forcedTitle,
  forcedIcon,
}: {
  dataSource: DataSource;
  forcedTitle?: string | null | undefined;
  forcedIcon?: string | null | undefined;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: saveDefaultConfig } = useMutation(
    trpc.dataSource.updateDefaultInspectorConfig.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.dataSource.listPublic.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(
          err.message || "Failed to save default inspector settings.",
        );
      },
    }),
  );

  const onSave = useCallback(
    async (config: DefaultInspectorDataSourceConfig) => {
      await saveDefaultConfig({ dataSourceId: dataSource.id, config });
    },
    [dataSource.id, saveDefaultConfig],
  );

  const allColumnNames = useMemo(
    () => dataSource.columnDefs.map((c) => c.name),
    [dataSource.columnDefs],
  );

  const [localConfig, setLocalConfig] = useState<InspectorDataSourceConfig>(
    () => {
      const raw = toEditingConfig(
        dataSource.id,
        dataSource.defaultInspectorConfig,
        dataSource.name,
      );
      const allCols = dataSource.columnDefs.map((c) => c.name);
      return normalizeInspectorDataSourceConfig(raw, allCols) ?? raw;
    },
  );

  // Keep inspector title/icon aligned with the "General" settings.
  useEffect(() => {
    const nextName =
      forcedTitle && forcedTitle.trim().length > 0
        ? forcedTitle.trim()
        : dataSource.name;
    const nextIcon =
      forcedIcon && forcedIcon.trim().length > 0
        ? forcedIcon.trim()
        : undefined;

    setLocalConfig((prev) => {
      const changed = prev.name !== nextName || prev.icon !== nextIcon;
      if (!changed) return prev;
      return { ...prev, name: nextName, icon: nextIcon };
    });
    // Intentionally do not mark dirty; the source of truth is the General section.
  }, [dataSource.name, forcedIcon, forcedTitle]);

  const [isSaving, setIsSaving] = useState(false);
  const didInitAutoSaveRef = useRef(false);
  const autoSaveTimeoutRef = useRef<number | null>(null);

  // Cancel is no longer exposed; inspector settings auto-save.

  const allColumnsSorted = useMemo(
    () => getAllColumnsSorted(allColumnNames),
    [allColumnNames],
  );

  const {
    allColumnsInOrder,
    selectedColumnsInOrder,
    selectedItemsInOrder,
    availableColumns,
    columnIds,
  } = useMemo(
    () => getColumnOrderState(localConfig, allColumnNames),
    [localConfig, allColumnNames],
  );

  const updateConfig = useCallback(
    (
      updater: (prev: InspectorDataSourceConfig) => InspectorDataSourceConfig,
    ) => {
      setLocalConfig((prev) => {
        const next = updater(prev);
        return normalizeInspectorDataSourceConfig(next, allColumnNames) ?? next;
      });
    },
    [allColumnNames],
  );

  // Auto-save inspector config changes (debounced).
  useEffect(() => {
    if (!didInitAutoSaveRef.current) {
      didInitAutoSaveRef.current = true;
      return;
    }
    if (autoSaveTimeoutRef.current) {
      window.clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(() => {
      setIsSaving(true);
      void onSave(toDefaultConfig(localConfig))
        .catch(() => {
          // toast handled by mutation onError
        })
        .finally(() => {
          setIsSaving(false);
        });
    }, 600);

    return () => {
      if (autoSaveTimeoutRef.current) {
        window.clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [localConfig, onSave]);

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
            Configure how this public data source appears in the inspector when
            added to a map. These settings are used as defaults for all users.
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          {isSaving ? "Saving…" : "Autosaved"}
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          availableColumns={availableColumns}
          columnIds={columnIds}
          columns={columns}
          columnMetadata={columnMetadata}
          updateConfig={updateConfig}
          handleAddColumn={handleAddColumn}
          handleRemoveColumn={handleRemoveColumn}
          handleRemoveColumnFromRight={handleRemoveColumnFromRight}
        />
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
