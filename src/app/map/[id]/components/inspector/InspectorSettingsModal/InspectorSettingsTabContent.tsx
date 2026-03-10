"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { INSPECTOR_COLOR_OPTIONS } from "../inspectorPanelOptions";
import {
  getSelectedColumnsOrdered,
  normalizeInspectorBoundaryConfig,
} from "../inspectorColumnOrder";
import { ColumnOrderList } from "./ColumnOrderList";
import { DEFAULT_SELECT_VALUE } from "./constants";
import type { InspectorLayout } from "./constants";
import type { DataSource } from "@/server/models/DataSource";
import type {
  DefaultInspectorBoundaryConfig,
  InspectorBoundaryConfig,
} from "@/server/models/MapView";
import type { useMapViews } from "../../../hooks/useMapViews";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InspectorSettingsTabContentProps {
  dataSource: DataSource;
  boundaryConfig: InspectorBoundaryConfig | null;
  updateBoundaryConfig: (
    updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig,
  ) => void;
  getLatestView: ReturnType<typeof useMapViews>["getLatestView"];
  updateView: ReturnType<typeof useMapViews>["updateView"];
  onReorderColumns: (
    dataSourceId: string,
    orderedColumnNames: string[],
  ) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PanelOptionsGrid({
  boundaryConfig,
  updateBoundaryConfig,
}: {
  boundaryConfig: InspectorBoundaryConfig;
  updateBoundaryConfig: InspectorSettingsTabContentProps["updateBoundaryConfig"];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-2">
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">Colour</Label>
        <Select
          value={boundaryConfig.color ?? DEFAULT_SELECT_VALUE}
          onValueChange={(value) =>
            updateBoundaryConfig((prev) => ({
              ...prev,
              color: value === DEFAULT_SELECT_VALUE ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="h-9 w-full truncate">
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
        <Label className="text-muted-foreground text-xs">Layout</Label>
        <Select
          value={(boundaryConfig.layout ?? "single") as InspectorLayout}
          onValueChange={(value: InspectorLayout) =>
            updateBoundaryConfig((prev) => ({ ...prev, layout: value }))
          }
        >
          <SelectTrigger className="h-9 w-full truncate">
            <SelectValue placeholder="Layout" />
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
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function InspectorSettingsTabContent({
  dataSource,
  boundaryConfig,
  updateBoundaryConfig,
  getLatestView,
  updateView,
  onReorderColumns,
}: InspectorSettingsTabContentProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: saveConfig } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.dataSource.listReadable.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to save.");
      },
    }),
  );

  const defaultConfig = dataSource.defaultInspectorConfig ?? null;

  const allColumnNames = useMemo(
    () => dataSource.columnDefs.map((c) => c.name),
    [dataSource.columnDefs],
  );

  const columnMetadata = useMemo(
    () => defaultConfig?.columnMetadata ?? {},
    [defaultConfig?.columnMetadata],
  );

  const columnsInInspectorSet = useMemo(() => {
    const list = boundaryConfig?.columns ?? defaultConfig?.columns ?? [];
    return list.length === 0
      ? new Set<string>(allColumnNames)
      : new Set(list);
  }, [boundaryConfig?.columns, defaultConfig?.columns, allColumnNames]);

  const selectedColumnsOrdered = useMemo(
    () => (boundaryConfig ? getSelectedColumnsOrdered(boundaryConfig) : []),
    [boundaryConfig],
  );

  const columnsListOrder = useMemo(() => {
    const rest = allColumnNames.filter((n) => !selectedColumnsOrdered.includes(n));
    return [...selectedColumnsOrdered, ...rest];
  }, [selectedColumnsOrdered, allColumnNames]);

  const setColumnShowInInspector = useCallback(
    (colName: string, show: boolean) => {
      if (boundaryConfig && getLatestView && updateView) {
        const latestView = getLatestView();
        if (!latestView?.inspectorConfig?.boundaries) return;
        const boundaries = latestView.inspectorConfig.boundaries;
        const index = boundaries.findIndex(
          (c) => c.dataSourceId === dataSource.id,
        );
        if (index === -1) return;
        const config = boundaries[index];
        const current = config.columns ?? [];
        const nextColumns = show
          ? current.includes(colName) ? current : [...current, colName]
          : current.filter((c) => c !== colName);
        const normalized = normalizeInspectorBoundaryConfig(
          { ...config, columns: nextColumns, columnOrder: nextColumns },
          allColumnNames,
        );
        if (!normalized) return;
        const next = [...boundaries];
        next[index] = { ...normalized, columnItems: normalized.columns };
        updateView({
          ...latestView,
          inspectorConfig: {
            ...latestView.inspectorConfig,
            boundaries: next,
          },
        });
      } else {
        const current = defaultConfig?.columns ?? [];
        const nextColumns = show
          ? current.includes(colName) ? current : [...current, colName]
          : current.filter((c) => c !== colName);
        const nextDefault: DefaultInspectorBoundaryConfig = {
          ...defaultConfig,
          name: defaultConfig?.name ?? dataSource.name ?? "Boundary Data",
          type: defaultConfig?.type ?? InspectorBoundaryConfigType.Simple,
          columns: nextColumns,
          columnMetadata: defaultConfig?.columnMetadata ?? {},
        };
        saveConfig({
          dataSourceId: dataSource.id,
          defaultInspectorConfig: nextDefault,
        }).catch(() => {});
      }
    },
    [
      boundaryConfig,
      dataSource.id,
      dataSource.name,
      defaultConfig,
      getLatestView,
      updateView,
      allColumnNames,
      saveConfig,
    ],
  );

  if (!boundaryConfig) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Enable &ldquo;Show in inspector&rdquo; to configure columns.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Inspector panel options (per-map overrides) */}
      <div className="shrink-0 p-6 pb-4 space-y-4">
        <PanelOptionsGrid
          boundaryConfig={boundaryConfig}
          updateBoundaryConfig={updateBoundaryConfig}
        />
      </div>

      {/* Columns: visibility + order (independently scrollable) */}
      <div className="flex-1 min-h-0 flex flex-row border-t border-neutral-200 overflow-hidden">
        {/* Visibility */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col border-r border-neutral-200 overflow-hidden">
          <div className="shrink-0 px-6 pt-4 pb-2">
            <h3 className="text-sm font-medium text-foreground mb-1">
              Columns in inspector
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose which columns appear when this data source is shown in
              the inspector.
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <div className="flex flex-col gap-1.5">
              {columnsListOrder.map((colName) => (
                <label
                  key={colName}
                  className="flex items-center gap-2 py-1 px-2 rounded hover:bg-neutral-50 cursor-pointer"
                >
                  <Checkbox
                    checked={columnsInInspectorSet.has(colName)}
                    onCheckedChange={(checked) =>
                      setColumnShowInInspector(colName, checked === true)
                    }
                    aria-label={`Show ${colName} in inspector`}
                  />
                  <span className="text-sm truncate">
                    {columnMetadata[colName]?.displayName ?? colName}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <div className="shrink-0 px-6 pt-4 pb-2">
            <h3 className="text-sm font-medium text-foreground mb-1">
              Column order
            </h3>
            <p className="text-xs text-muted-foreground">
              Drag to reorder how columns appear in the inspector.
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <ColumnOrderList
              selectedColumns={selectedColumnsOrdered}
              getLabel={(col) => columnMetadata[col]?.displayName ?? col}
              dataSourceId={dataSource.id}
              onReorderColumns={onReorderColumns}
            />
          </div>
        </div>
      </div>
    </>
  );
}
