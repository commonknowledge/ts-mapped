"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import { useDataSources } from "../../../hooks/useDataSources";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useMapViews } from "../../../hooks/useMapViews";
import { normalizeInspectorBoundaryConfig } from "../inspectorColumnOrder";
import { DataSourcesList } from "./DataSourcesList";
import { GeneralColumnOptionsPanel } from "./GeneralColumnOptionsPanel";
import { InspectorSettingsTabContent } from "./InspectorSettingsTabContent";
import type { DataSource } from "@/server/models/DataSource";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InspectorSettingsModal({
  open,
  onOpenChange,
  initialDataSourceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDataSourceId?: string | null;
}) {
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const { data: dataSources, getDataSourceById } = useDataSources();
  const { view, viewConfig, getLatestView, updateView } = useMapViews();

  const boundaryConfigs = useMemo(
    () => view?.inspectorConfig?.boundaries ?? [],
    [view?.inspectorConfig?.boundaries],
  );
  const onMapId = viewConfig.areaDataSourceId || null;

  // ---- Search / filtering ------------------------------------------------

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

  const filteredSources = useMemo(() => {
    const list = dataSources ?? [];
    if (!debouncedSearchQuery.trim()) return list;
    return list.filter(matchesSearch);
  }, [dataSources, debouncedSearchQuery, matchesSearch]);

  const { inspectorOrdered, otherSources } = useMemo(() => {
    const inInspector = boundaryConfigs
      .map((config) => ({
        config,
        dataSource: getDataSourceById(config.dataSourceId),
      }))
      .filter(
        (x): x is {
          config: InspectorBoundaryConfig;
          dataSource: NonNullable<ReturnType<typeof getDataSourceById>>;
        } => x.dataSource != null && matchesSearch(x.dataSource),
      );
    const inIds = new Set(inInspector.map((x) => x.dataSource.id));
    const other = filteredSources.filter((ds) => !inIds.has(ds.id));
    return { inspectorOrdered: inInspector, otherSources: other };
  }, [boundaryConfigs, getDataSourceById, filteredSources, matchesSearch]);

  // ---- Initial selection -------------------------------------------------

  useEffect(() => {
    if (open && initialDataSourceId != null) {
      setSelectedDataSourceId(initialDataSourceId);
    }
  }, [open, initialDataSourceId]);

  // ---- Derived selection state -------------------------------------------

  const selectedConfig = useMemo(
    () =>
      selectedDataSourceId
        ? (boundaryConfigs.find((c) => c.dataSourceId === selectedDataSourceId) ?? null)
        : null,
    [selectedDataSourceId, boundaryConfigs],
  );

  const selectedDataSource = useMemo(
    () =>
      selectedDataSourceId
        ? ((dataSources ?? []).find((ds) => ds.id === selectedDataSourceId) ?? null)
        : null,
    [selectedDataSourceId, dataSources],
  );

  const isInInspector = !!selectedConfig;

  // ---- Mutations ---------------------------------------------------------

  const handleAddToInspector = useCallback(() => {
    if (!view || !selectedDataSourceId) return;
    const ds = (dataSources ?? []).find((d) => d.id === selectedDataSourceId);
    if (!ds) return;
    const cfg = ds.defaultInspectorConfig;
    const allCols = ds.columnDefs.map((c) => c.name);
    const defaultColumns = cfg?.columns?.length ? cfg.columns : allCols;
    const raw: InspectorBoundaryConfig = {
      id: uuidv4(),
      dataSourceId: selectedDataSourceId,
      name: cfg?.name ?? ds.name ?? "Boundary Data",
      type: cfg?.type ?? InspectorBoundaryConfigType.Simple,
      columns: defaultColumns,
      columnOrder: cfg?.columnOrder ?? defaultColumns,
      columnItems: cfg?.columnItems,
      columnMetadata: cfg?.columnMetadata,
      columnGroups: cfg?.columnGroups,
      layout: cfg?.layout ?? "single",
      icon: cfg?.icon,
      color: cfg?.color,
    };
    const newConfig = normalizeInspectorBoundaryConfig(raw, allCols) ?? raw;
    const prev = view.inspectorConfig?.boundaries ?? [];
    updateView({
      ...view,
      inspectorConfig: { ...view.inspectorConfig, boundaries: [...prev, newConfig] },
    });
  }, [view, selectedDataSourceId, dataSources, updateView]);

  const handleRemoveFromInspector = useCallback(
    (configId: string) => {
      if (!view) return;
      updateView({
        ...view,
        inspectorConfig: {
          ...view.inspectorConfig,
          boundaries: boundaryConfigs.filter((c) => c.id !== configId),
        },
      });
    },
    [view, boundaryConfigs, updateView],
  );

  const onAppearInInspectorChange = useCallback(
    (checked: boolean) => {
      if (!selectedDataSourceId || !view) return;
      if (checked) {
        handleAddToInspector();
      } else {
        const config = boundaryConfigs.find(
          (c) => c.dataSourceId === selectedDataSourceId,
        );
        if (config) handleRemoveFromInspector(config.id);
      }
    },
    [selectedDataSourceId, view, boundaryConfigs, handleAddToInspector, handleRemoveFromInspector],
  );

  const updateBoundaryConfig = useCallback(
    (updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig) => {
      if (!selectedConfig || !view) return;
      const latestView = getLatestView();
      if (!latestView?.inspectorConfig?.boundaries) return;
      const boundaries = latestView.inspectorConfig.boundaries;
      const index = boundaries.findIndex((c) => c.id === selectedConfig.id);
      if (index === -1) return;
      const next = [...boundaries];
      next[index] = updater(boundaries[index]);
      updateView({
        ...latestView,
        inspectorConfig: { ...latestView.inspectorConfig, boundaries: next },
      });
    },
    [selectedConfig, view, getLatestView, updateView],
  );

  const handleReorderColumns = useCallback(
    (dataSourceId: string, orderedColumnNames: string[]) => {
      const latestView = getLatestView();
      if (!latestView?.inspectorConfig?.boundaries) return;
      const boundaries = latestView.inspectorConfig.boundaries;
      const index = boundaries.findIndex((c) => c.dataSourceId === dataSourceId);
      if (index === -1) return;
      const next = [...boundaries];
      next[index] = {
        ...boundaries[index],
        columns: orderedColumnNames,
        columnOrder: orderedColumnNames,
        columnItems: orderedColumnNames,
      };
      updateView({
        ...latestView,
        inspectorConfig: { ...latestView.inspectorConfig, boundaries: next },
      });
    },
    [getLatestView, updateView],
  );

  // ---- Panel display name (debounced) ------------------------------------

  const [panelDisplayName, setPanelDisplayName] = useState(selectedConfig?.name ?? "");

  useEffect(() => {
    setPanelDisplayName(selectedConfig?.name ?? selectedDataSource?.name ?? "");
  }, [selectedConfig?.name, selectedDataSource?.name]);

  const debouncedUpdatePanelName = useDebouncedCallback(
    (value: string) => updateBoundaryConfig((prev) => ({ ...prev, name: value })),
    600,
  );

  // ---- Render ------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ width: "90vw", maxWidth: 1800 }}
        onPointerDownOutside={() => setSelectedDataSourceId(null)}
      >
        <DialogHeader className="flex flex-row gap-10 px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Visualisation data settings</DialogTitle>
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

          <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            {selectedDataSource ? (
              <Tabs defaultValue="general" className="flex flex-col h-full min-h-0 gap-0">
                <div className="shrink-0 p-3 border-b">
                  <TabsList className="w-fit">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="inspector">Inspector settings</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="general"
                  className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden flex flex-col"
                >
                  <GeneralColumnOptionsPanel dataSource={selectedDataSource} />
                </TabsContent>

                <TabsContent
                  value="inspector"
                  className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden flex flex-col"
                >
                  <InspectorSettingsTabContent
                    dataSource={selectedDataSource}
                    dataSourceName={selectedDataSource.name}
                    boundaryConfig={selectedConfig}
                    isInInspector={isInInspector}
                    onAppearInInspectorChange={onAppearInInspectorChange}
                    onAddToMap={handleAddToInspector}
                    updateBoundaryConfig={updateBoundaryConfig}
                    panelDisplayName={panelDisplayName}
                    setPanelDisplayName={setPanelDisplayName}
                    debouncedUpdatePanelName={debouncedUpdatePanelName}
                    getLatestView={getLatestView}
                    updateView={updateView}
                    selectedDataSourceId={selectedDataSourceId}
                    onReorderColumns={handleReorderColumns}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6">
                Select a data source to edit general column options and
                inspector settings.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
