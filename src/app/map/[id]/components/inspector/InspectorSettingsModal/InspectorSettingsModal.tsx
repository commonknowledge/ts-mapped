"use client";

import { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { useDataSources } from "../../../hooks/useDataSources";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useMapViews } from "../../../hooks/useMapViews";
import { normalizeInspectorBoundaryConfig } from "../inspectorColumnOrder";
import { InspectorFullPreview } from "../InspectorFullPreview";
import { DataSourcesList } from "./DataSourcesList";
import { InspectorSourceConfigPanel } from "./InspectorSourceConfigPanel";
import type { DataSource } from "@/server/models/DataSource";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";

export default function InspectorSettingsModal({
  open,
  onOpenChange,
  initialDataSourceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, pre-select this data source in the left list (used from real inspector cogs). */
  initialDataSourceId?: string | null;
}) {
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const { data: dataSources, getDataSourceById } = useDataSources();
  const { view, viewConfig, getLatestView, updateView } = useMapViews();

  const boundaryConfigs = useMemo(
    () => view?.inspectorConfig?.boundaries ?? [],
    [view?.inspectorConfig?.boundaries],
  );
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

  // When opened with an initial data source id, focus that source.
  if (
    open &&
    initialDataSourceId &&
    selectedDataSourceId !== initialDataSourceId
  ) {
    setSelectedDataSourceId(initialDataSourceId);
  }

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
    if (!ds) return;
    const defaultConfig = ds.defaultInspectorConfig;
    const allCols = ds.columnDefs.map((c) => c.name);
    const raw: InspectorBoundaryConfig = {
      id: uuidv4(),
      dataSourceId: selectedDataSourceId,
      name: defaultConfig?.name ?? ds.name ?? "Boundary Data",
      type: defaultConfig?.type ?? InspectorBoundaryConfigType.Simple,
      columns: defaultConfig?.columns ?? [],
      columnOrder: defaultConfig?.columnOrder,
      columnItems: defaultConfig?.columnItems,
      columnMetadata: defaultConfig?.columnMetadata,
      columnGroups: defaultConfig?.columnGroups,
      layout: defaultConfig?.layout ?? "single",
      icon: defaultConfig?.icon,
      color: defaultConfig?.color,
    };
    const newConfig = normalizeInspectorBoundaryConfig(raw, allCols) ?? raw;
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
        className="h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ width: "90vw", maxWidth: "1800px" }}
        onPointerDownOutside={() => setSelectedDataSourceId(null)}
      >
        <DialogHeader className="flex flex-row gap-10 px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Inspector settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose data sources to show in the inspector and configure columns,
            order, and layout.
          </p>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 min-w-0">
          <DataSourcesList
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            inspectorOrdered={inspectorOrdered}
            otherSources={otherSources}
            onMapId={onMapId}
            selectedDataSourceId={selectedDataSourceId}
            onSelectDataSource={setSelectedDataSourceId}
            onRemoveFromInspector={handleRemoveFromInspector}
          />

          <div className="flex-1 min-w-0 border-r flex flex-col overflow-hidden">
            {selectedDataSource && view ? (
              <InspectorSourceConfigPanel
                dataSource={selectedDataSource}
                config={selectedConfig}
                onAddToInspector={handleAddToInspector}
                isInInspector={!!selectedConfig}
                getLatestView={getLatestView}
                updateView={updateView}
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
