"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useDataSources } from "../../../hooks/useDataSources";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useMapConfig } from "../../../hooks/useMapConfig";
import { useMapViews } from "../../../hooks/useMapViews";
import { mapColors } from "../../../styles";
import { normalizeInspectorBoundaryConfig } from "../inspectorColumnOrder";
import { InspectorFullPreview } from "../InspectorFullPreview";
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
  initialTab = "general",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDataSourceId?: string | null;
  /** Tab to show when opening: "general" (layer/column options) or "inspector". */
  initialTab?: "general" | "inspector";
}) {
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "inspector">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiddenFromInspector, setHiddenFromInspector] = useState<Set<string>>(new Set());
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 500);
  const { data: dataSources, getDataSourceById } = useDataSources();
  const { mapConfig, updateMapConfig } = useMapConfig();
  const { view, viewConfig, getLatestView, updateView, updateViewConfig } = useMapViews();

  const boundaryConfigs = useMemo(
    () => view?.inspectorConfig?.boundaries ?? [],
    [view?.inspectorConfig?.boundaries],
  );

  // ---- Map data sources (same logic as VD panel) --------------------------

  const mapDataSourceIds = useMemo(() => {
    const ids = new Set<string>();
    if (viewConfig.areaDataSourceId) ids.add(viewConfig.areaDataSourceId);
    mapConfig.markerDataSourceIds.forEach((id) => ids.add(id));
    if (mapConfig.membersDataSourceId) ids.add(mapConfig.membersDataSourceId);
    return ids;
  }, [viewConfig.areaDataSourceId, mapConfig.markerDataSourceIds, mapConfig.membersDataSourceId]);

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

  const { markerSources, visualisationSources, librarySources } = useMemo(() => {
    const all = (dataSources ?? []).filter(matchesSearch);
    const markerIds = new Set<string>();
    mapConfig.markerDataSourceIds.forEach((id) => markerIds.add(id));
    if (mapConfig.membersDataSourceId) markerIds.add(mapConfig.membersDataSourceId);
    const visIds = new Set<string>();
    if (viewConfig.areaDataSourceId) visIds.add(viewConfig.areaDataSourceId);
    const onMap = all.filter((ds) => markerIds.has(ds.id) || visIds.has(ds.id));
    return {
      markerSources: onMap.filter((ds) => markerIds.has(ds.id)),
      visualisationSources: onMap.filter((ds) => visIds.has(ds.id)),
      librarySources: all.filter((ds) => !markerIds.has(ds.id) && !visIds.has(ds.id)),
    };
  }, [dataSources, matchesSearch, mapConfig.markerDataSourceIds, mapConfig.membersDataSourceId, viewConfig.areaDataSourceId]);

  const markerLayerColors = useMemo(() => {
    const out: Record<string, string> = {};
    if (mapConfig.membersDataSourceId) {
      out[mapConfig.membersDataSourceId] = mapColors.member.color;
    }
    mapConfig.markerDataSourceIds.forEach((id) => {
      out[id] = mapConfig.markerColors?.[id] ?? mapColors.markers.color;
    });
    return out;
  }, [mapConfig.membersDataSourceId, mapConfig.markerDataSourceIds, mapConfig.markerColors]);

  // ---- Initial selection and tab -----------------------------------------

  useEffect(() => {
    if (open) {
      if (initialDataSourceId != null) setSelectedDataSourceId(initialDataSourceId);
      setActiveTab(initialTab);
    }
  }, [open, initialDataSourceId, initialTab]);

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

  // ---- Mutations ---------------------------------------------------------

  const addToInspector = useCallback(
    (dataSourceId: string) => {
      if (!view) return;
      const existing = (view.inspectorConfig?.boundaries ?? []).find(
        (c) => c.dataSourceId === dataSourceId,
      );
      if (existing) return;
      const ds = (dataSources ?? []).find((d) => d.id === dataSourceId);
      if (!ds) return;
      const cfg = ds.defaultInspectorConfig;
      const allCols = ds.columnDefs.map((c) => c.name);
      const defaultColumns = cfg?.columns?.length ? cfg.columns : allCols;
      const raw: InspectorBoundaryConfig = {
        id: uuidv4(),
        dataSourceId,
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
    },
    [view, dataSources, updateView],
  );

  // Auto-add to inspector when a map data source is selected without a config
  useEffect(() => {
    if (!selectedDataSourceId) return;
    if (!mapDataSourceIds.has(selectedDataSourceId)) return;
    if (hiddenFromInspector.has(selectedDataSourceId)) return;
    const hasConfig = boundaryConfigs.some(
      (c) => c.dataSourceId === selectedDataSourceId,
    );
    if (!hasConfig) {
      addToInspector(selectedDataSourceId);
    }
  }, [selectedDataSourceId, mapDataSourceIds, boundaryConfigs, addToInspector, hiddenFromInspector]);

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

  const handleRemoveFromMap = useCallback(
    (dataSourceId: string) => {
      if (mapConfig.membersDataSourceId === dataSourceId) {
        updateMapConfig({ membersDataSourceId: null });
      }
      if (mapConfig.markerDataSourceIds.includes(dataSourceId)) {
        updateMapConfig({
          markerDataSourceIds: mapConfig.markerDataSourceIds.filter(
            (id) => id !== dataSourceId,
          ),
        });
      }
      if (viewConfig.areaDataSourceId === dataSourceId) {
        updateViewConfig({ areaDataSourceId: "", areaDataColumn: "" });
      }
      const config = boundaryConfigs.find((c) => c.dataSourceId === dataSourceId);
      if (config) {
        handleRemoveFromInspector(config.id);
      }
      if (selectedDataSourceId === dataSourceId) {
        setSelectedDataSourceId(null);
      }
    },
    [mapConfig, viewConfig, boundaryConfigs, updateMapConfig, updateViewConfig, handleRemoveFromInspector, selectedDataSourceId],
  );

  const handleAddToMap = useCallback(
    (dataSourceId: string) => {
      if (mapConfig.markerDataSourceIds.includes(dataSourceId)) return;
      updateMapConfig({
        markerDataSourceIds: [...mapConfig.markerDataSourceIds, dataSourceId],
      });
    },
    [mapConfig, updateMapConfig],
  );

  const isOnMap = selectedDataSourceId ? mapDataSourceIds.has(selectedDataSourceId) : false;

  const onAppearInInspectorChange = useCallback(
    (checked: boolean) => {
      if (!selectedDataSourceId || !view) return;
      if (checked) {
        setHiddenFromInspector((prev) => {
          const next = new Set(prev);
          next.delete(selectedDataSourceId);
          return next;
        });
        addToInspector(selectedDataSourceId);
      } else {
        setHiddenFromInspector((prev) => new Set(prev).add(selectedDataSourceId));
        const config = boundaryConfigs.find(
          (c) => c.dataSourceId === selectedDataSourceId,
        );
        if (config) handleRemoveFromInspector(config.id);
      }
    },
    [selectedDataSourceId, view, boundaryConfigs, addToInspector, handleRemoveFromInspector],
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

  // ---- Render ------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ width: "90vw", maxWidth: 1800 }}
        onPointerDownOutside={() => setSelectedDataSourceId(null)}
      >
        <DialogHeader className="flex flex-row gap-10 px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Data settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 min-w-0">
          <DataSourcesList
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            markerSources={markerSources}
            visualisationSources={visualisationSources}
            librarySources={librarySources}
            selectedDataSourceId={selectedDataSourceId}
            onSelectDataSource={setSelectedDataSourceId}
            onRemoveFromMap={handleRemoveFromMap}
            markerLayerColors={markerLayerColors}
          />

          <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            {selectedDataSource && isOnMap ? (
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "general" | "inspector")}
                className="flex flex-col h-full min-h-0 gap-0"
              >
                <div className="shrink-0 border-b">
                  <div className="px-4 pt-3 pb-1">
                    <h3 className="text-sm font-semibold truncate">
                      {selectedDataSource.name}
                    </h3>
                  </div>
                  <div className="px-3 pb-3 flex items-center justify-between gap-4">
                    <TabsList className="w-fit">
                      <TabsTrigger value="general">Layer</TabsTrigger>
                      <TabsTrigger
                        value="inspector"
                        disabled={!selectedConfig}
                        className="disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Inspector
                      </TabsTrigger>
                    </TabsList>
                    <label className="flex items-center gap-2 shrink-0 cursor-pointer pr-1">
                      <Checkbox
                        id="show-in-inspector"
                        checked={!!selectedConfig}
                        onCheckedChange={(checked) =>
                          onAppearInInspectorChange(checked === true)
                        }
                      />
                      <span className="text-sm font-medium whitespace-nowrap">
                        Show in inspector
                      </span>
                    </label>
                  </div>
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
                    boundaryConfig={selectedConfig}
                    updateBoundaryConfig={updateBoundaryConfig}
                    getLatestView={getLatestView}
                    updateView={updateView}
                    onReorderColumns={handleReorderColumns}
                  />
                </TabsContent>
              </Tabs>
            ) : selectedDataSource ? (
              <div className="flex-1 flex flex-col">
                <div className="shrink-0 border-b px-4 py-3">
                  <h3 className="text-sm font-semibold truncate">
                    {selectedDataSource.name}
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This data source is not on the map yet.
                    </p>
                    <Button
                      onClick={() => handleAddToMap(selectedDataSource.id)}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add to map
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6">
                Select a data source to edit general column options and
                inspector settings.
              </div>
            )}
          </div>

          {selectedDataSourceId && (
            <div
              className="flex flex-col shrink-0 overflow-hidden p-4 bg-neutral-50 border-l border-neutral-200"
              style={{ width: 360, minWidth: 320 }}
            >
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Preview
              </p>
              <InspectorFullPreview
                className="flex-1 min-h-0"
                selectedDataSourceId={selectedDataSourceId}
                onReorderColumns={handleReorderColumns}
                previewDataSource={!isOnMap ? selectedDataSource : null}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
