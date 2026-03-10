"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
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
import { INSPECTOR_ICON_OPTIONS } from "../inspectorPanelOptions";
import { GlobalColumnRow } from "./GlobalColumnRow";
import { DEFAULT_SELECT_VALUE } from "./constants";
import { inferFormat } from "./constants";
import type { DataSource } from "@/server/models/DataSource";
import type {
  DefaultInspectorBoundaryConfig,
  InspectorColumnMeta,
} from "@/server/models/MapView";


/**
 * General column options that apply everywhere: label (display name),
 * description, format. No inspector-specific visibility.
 */
export function GeneralColumnOptionsPanel({
  dataSource,
}: {
  dataSource: DataSource;
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
          err.message ?? "Failed to save column settings.",
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

  const [localDisplayName, setLocalDisplayName] = useState(
    defaultConfig?.name ?? dataSource.name ?? "",
  );
  const [localIcon, setLocalIcon] = useState(
    defaultConfig?.icon ?? "",
  );
  useEffect(() => {
    setLocalDisplayName(defaultConfig?.name ?? dataSource.name ?? "");
    setLocalIcon(defaultConfig?.icon ?? "");
  }, [dataSource.id, defaultConfig?.name, defaultConfig?.icon, dataSource.name]);

  const saveDisplayNameAndIcon = useCallback(
    (name: string, icon: string) => {
      const nextDefault: DefaultInspectorBoundaryConfig = {
        ...defaultConfig,
        name: name || (dataSource.name ?? "Boundary Data"),
        type: defaultConfig?.type ?? InspectorBoundaryConfigType.Simple,
        columns: defaultConfig?.columns ?? [],
        columnMetadata: defaultConfig?.columnMetadata ?? {},
        icon: icon || undefined,
      };
      saveConfig({
        dataSourceId: dataSource.id,
        defaultInspectorConfig: nextDefault,
      }).catch(() => {});
    },
    [dataSource.id, dataSource.name, defaultConfig, saveConfig],
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
        You don’t have permission to edit column settings for this data source.
      </div>
    );
  }

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollToColumn = useCallback((colName: string) => {
    const container = mainScrollRef.current;
    const row = columnRefs.current[colName];
    if (!container || !row) return;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const scrollTop =
      container.scrollTop + (rowRect.top - containerRect.top) - 16;
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
  }, []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <aside className="w-52 shrink-0 border-r border-neutral-200 flex flex-col overflow-hidden">
        <div className="p-3 pb-2 shrink-0">
          <h3 className="text-sm font-medium text-foreground">
            Columns
          </h3>
          <Input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 mt-2 text-xs"
          />
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
          <ul className="space-y-0.5">
            {filteredColumns.map((colName) => (
              <li key={colName}>
                <button
                  type="button"
                  onClick={() => scrollToColumn(colName)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-xs truncate",
                    "hover:bg-neutral-100 text-foreground",
                  )}
                >
                  {localMetadata[colName]?.displayName ?? colName}
                </button>
              </li>
            ))}
          </ul>
          {filteredColumns.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-2">
              {allColumnNames.length === 0 ? "No columns" : "No match"}
            </p>
          )}
        </nav>
      </aside>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="shrink-0 p-6 pb-4 border-b border-neutral-200">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Data source settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Display name</Label>
              <Input
                value={localDisplayName}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalDisplayName(v);
                  saveDisplayNameAndIcon(v, localIcon);
                }}
                placeholder="e.g. Main data"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Icon</Label>
              <Select
                value={localIcon || DEFAULT_SELECT_VALUE}
                onValueChange={(value) => {
                  const v = value === DEFAULT_SELECT_VALUE ? "" : value;
                  setLocalIcon(v);
                  saveDisplayNameAndIcon(localDisplayName, v);
                }}
              >
                <SelectTrigger className="h-9 w-full truncate">
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
          </div>
        </div>
        <div className="p-6 pb-2 shrink-0">
          <h3 className="text-sm font-medium text-foreground">
            Column options
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Label, description, and format apply everywhere this data source is
            used.
          </p>
        </div>
        <div
          ref={mainScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pb-6"
        >
          <div className="space-y-0">
            {filteredColumns.map((colName) => {
              const meta = localMetadata[colName] ?? {};
              const inferredFormat = inferFormat(colName);
              const format = meta.format ?? inferredFormat ?? "text";
              return (
                <div
                  key={colName}
                  ref={(el) => {
                    if (el) columnRefs.current[colName] = el;
                    else delete columnRefs.current[colName];
                  }}
                  className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0"
                >
                  <GlobalColumnRow
                    alwaysExpanded
                    columnName={colName}
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
                </div>
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
    </div>
  );
}
