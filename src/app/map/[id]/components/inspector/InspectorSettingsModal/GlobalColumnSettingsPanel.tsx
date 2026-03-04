"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/services/trpc/react";
import { Input } from "@/shadcn/ui/input";
import { GlobalColumnRow } from "./GlobalColumnRow";
import { inferFormat } from "./constants";
import { normalizeInspectorBoundaryConfig } from "../inspectorColumnOrder";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
import type { DataSource } from "@/server/models/DataSource";
import type {
  DefaultInspectorBoundaryConfig,
  InspectorBoundaryConfig,
  InspectorColumnMeta,
} from "@/server/models/MapView";
import type { useMapViews } from "../../../hooks/useMapViews";

export function GlobalColumnSettingsPanel({
  dataSource,
  boundaryConfig,
  getLatestView,
  updateView,
}: {
  dataSource: DataSource;
  boundaryConfig?: InspectorBoundaryConfig | null;
  getLatestView?: ReturnType<typeof useMapViews>["getLatestView"];
  updateView?: ReturnType<typeof useMapViews>["updateView"];
}) {
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
        toast.error(
          err.message ?? "Failed to save default column settings.",
        );
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

  const [localMetadata, setLocalMetadata] =
    useState<Record<string, InspectorColumnMeta>>(columnMetadata);
  useEffect(() => {
    setLocalMetadata(columnMetadata);
  }, [dataSource.id, columnMetadata]);

  const updateMetadata = useCallback(
    (colName: string, updater: (prev: InspectorColumnMeta) => InspectorColumnMeta) => {
      const updatedMeta = updater(localMetadata[colName] ?? {});
      setLocalMetadata((prev) => ({
        ...prev,
        [colName]: updatedMeta,
      }));
      const nextMetadata = {
        ...localMetadata,
        [colName]: updatedMeta,
      };
      const nextDefault: DefaultInspectorBoundaryConfig = {
        ...defaultConfig,
        name: defaultConfig?.name ?? dataSource.name ?? "Boundary Data",
        type: defaultConfig?.type ?? InspectorBoundaryConfigType.Simple,
        columns: defaultConfig?.columns ?? [],
        columnMetadata: nextMetadata,
      };
      saveConfig({
        dataSourceId: dataSource.id,
        defaultInspectorConfig: nextDefault,
      }).catch(() => {});
    },
    [dataSource.id, dataSource.name, defaultConfig, localMetadata, saveConfig],
  );

  const columnsInInspectorSet = useMemo(() => {
    const list = boundaryConfig?.columns ?? defaultConfig?.columns ?? [];
    if (list.length === 0) return new Set<string>(allColumnNames);
    return new Set(list);
  }, [
    boundaryConfig?.columns,
    defaultConfig?.columns,
    allColumnNames,
  ]);

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
          ? current.includes(colName)
            ? current
            : [...current, colName]
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
          ? current.includes(colName)
            ? current
            : [...current, colName]
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

  const [search, setSearch] = useState("");
  const filteredColumns = useMemo(() => {
    if (!search.trim()) return allColumnNames;
    const q = search.toLowerCase();
    return allColumnNames.filter((name) =>
      name.toLowerCase().includes(q) ||
      (localMetadata[name]?.displayName ?? "").toLowerCase().includes(q),
    );
  }, [allColumnNames, search, localMetadata]);

  const isOwner = "isOwner" in dataSource && dataSource.isOwner === true;
  if (!isOwner) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        You don’t have permission to edit default column settings for this data
        source.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 space-y-4 shrink-0">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Column settings
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set display names, formats, and choose which columns show in the
            inspector. Show in inspector is on by default.
          </p>
        </div>
        <Input
          type="search"
          placeholder="Search columns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-sm"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        <div className="space-y-2">
          {filteredColumns.map((colName) => {
            const meta = localMetadata[colName] ?? {};
            const inferredFormat = inferFormat(colName);
            const format = meta.format ?? inferredFormat ?? "text";
            return (
              <GlobalColumnRow
                key={colName}
                columnName={colName}
                showInInspector={columnsInInspectorSet.has(colName)}
                onShowInInspectorChange={(show) =>
                  setColumnShowInInspector(colName, show)
                }
                displayName={meta.displayName}
                onDisplayNameChange={(value) =>
                  updateMetadata(colName, (prev) => ({
                    ...prev,
                    displayName: value || undefined,
                  }))
                }
                description={meta.description}
                onDescriptionChange={(value) =>
                  updateMetadata(colName, (prev) => ({
                    ...prev,
                    description: value || undefined,
                  }))
                }
                format={format}
                onFormatChange={(value) =>
                  updateMetadata(colName, (prev) => ({ ...prev, format: value }))
                }
                comparisonStat={meta.comparisonStat}
                onComparisonStatChange={(value) =>
                  updateMetadata(colName, (prev) => ({
                    ...prev,
                    comparisonStat: value,
                  }))
                }
                scaleMax={meta.scaleMax ?? 3}
                onScaleMaxChange={(value) =>
                  updateMetadata(colName, (prev) => ({
                    ...prev,
                    scaleMax: value,
                  }))
                }
                barColor={meta.barColor}
                onBarColorChange={(value) =>
                  updateMetadata(colName, (prev) => ({
                    ...prev,
                    barColor: value || undefined,
                  }))
                }
              />
            );
          })}
        </div>
        {filteredColumns.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {allColumnNames.length === 0
              ? "This data source has no columns."
              : "No columns match your search."}
          </p>
        )}
      </div>
    </div>
  );
}
