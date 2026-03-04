"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { LayoutGrid, LayoutList } from "lucide-react";
import { InspectorBoundaryConfigType } from "@/server/models/MapView";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
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
import { useDataSources } from "../../../hooks/useDataSources";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useMapViews } from "../../../hooks/useMapViews";
import { normalizeInspectorBoundaryConfig } from "../inspectorColumnOrder";
import {
  INSPECTOR_COLOR_OPTIONS,
  INSPECTOR_ICON_OPTIONS,
} from "../inspectorPanelOptions";
import { InspectorFullPreview } from "../InspectorFullPreview";
import { DataSourcesList } from "./DataSourcesList";
import { DEFAULT_SELECT_VALUE } from "./constants";
import type { InspectorLayout } from "./constants";
import { GlobalColumnSettingsPanel } from "./GlobalColumnSettingsPanel";
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
  useEffect(() => {
    if (open && initialDataSourceId != null) {
      setSelectedDataSourceId(initialDataSourceId);
    }
  }, [open, initialDataSourceId]);

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
    const defaultColumns =
      defaultConfig?.columns?.length ? defaultConfig.columns : allCols;
    const raw: InspectorBoundaryConfig = {
      id: uuidv4(),
      dataSourceId: selectedDataSourceId,
      name: defaultConfig?.name ?? ds.name ?? "Boundary Data",
      type: defaultConfig?.type ?? InspectorBoundaryConfigType.Simple,
      columns: defaultColumns,
      columnOrder: defaultConfig?.columnOrder ?? defaultColumns,
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

  // Appear in inspector on by default: when user selects a data source not yet in the inspector, add it.
  useEffect(() => {
    if (
      open &&
      view &&
      selectedDataSourceId &&
      !selectedConfig &&
      (dataSources ?? []).some((d) => d.id === selectedDataSourceId)
    ) {
      handleAddToInspector();
    }
  }, [
    open,
    view,
    selectedDataSourceId,
    selectedConfig,
    dataSources,
    handleAddToInspector,
  ]);

  const isInInspector = !!selectedConfig;
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
    [
      selectedDataSourceId,
      view,
      boundaryConfigs,
      handleAddToInspector,
      handleRemoveFromInspector,
    ],
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
        inspectorConfig: {
          ...latestView.inspectorConfig,
          boundaries: next,
        },
      });
    },
    [selectedConfig, view, getLatestView, updateView],
  );

  const [panelDisplayName, setPanelDisplayName] = useState(
    selectedConfig?.name ?? "",
  );
  useEffect(() => {
    setPanelDisplayName(selectedConfig?.name ?? selectedDataSource?.name ?? "");
  }, [selectedConfig?.name, selectedDataSource?.name]);
  const debouncedUpdatePanelName = useDebouncedCallback(
    (value: string) =>
      updateBoundaryConfig((prev) => ({ ...prev, name: value })),
    600,
  );

  const handleReorderColumns = useCallback(
    (dataSourceId: string, orderedColumnNames: string[]) => {
      const latestView = getLatestView();
      if (!latestView?.inspectorConfig?.boundaries) return;
      const boundaries = latestView.inspectorConfig.boundaries;
      const index = boundaries.findIndex((c) => c.dataSourceId === dataSourceId);
      if (index === -1) return;
      const config = boundaries[index];
      const next = [...boundaries];
      next[index] = {
        ...config,
        columns: orderedColumnNames,
        columnOrder: orderedColumnNames,
        columnItems: orderedColumnNames,
      };
      updateView({
        ...latestView,
        inspectorConfig: {
          ...latestView.inspectorConfig,
          boundaries: next,
        },
      });
    },
    [getLatestView, updateView],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ width: "90vw", maxWidth: "1800px" }}
        onPointerDownOutside={() => setSelectedDataSourceId(null)}
      >
        <DialogHeader className="flex flex-row gap-10 px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Visualisation data settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose data sources to show in the inspector, edit column settings,
            and reorder columns in the preview.
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
            {selectedDataSource ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="shrink-0 px-6 pt-4 pb-3 border-b space-y-4">
                  <h2 className="text-base font-semibold truncate">
                    {selectedDataSource.name}
                  </h2>
                  {view && (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="appear-in-inspector"
                        checked={isInInspector}
                        onCheckedChange={(checked) =>
                          onAppearInInspectorChange(checked === true)
                        }
                      />
                      <Label
                        htmlFor="appear-in-inspector"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Appear in inspector
                      </Label>
                    </div>
                  )}
                  {isInInspector && selectedConfig && (
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs">
                          Display name
                        </Label>
                        <Input
                          value={panelDisplayName}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPanelDisplayName(v);
                            debouncedUpdatePanelName(v);
                          }}
                          placeholder="e.g. Main data"
                          className="h-9 max-w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs">
                          Icon
                        </Label>
                        <Select
                          value={selectedConfig.icon ?? DEFAULT_SELECT_VALUE}
                          onValueChange={(value) =>
                            updateBoundaryConfig((prev) => ({
                              ...prev,
                              icon:
                                value === DEFAULT_SELECT_VALUE
                                  ? undefined
                                  : value,
                            }))
                          }
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
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs">
                          Colour
                        </Label>
                        <Select
                          value={selectedConfig.color ?? DEFAULT_SELECT_VALUE}
                          onValueChange={(value) =>
                            updateBoundaryConfig((prev) => ({
                              ...prev,
                              color:
                                value === DEFAULT_SELECT_VALUE
                                  ? undefined
                                  : value,
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
                        <Label className="text-muted-foreground text-xs">
                          Layout
                        </Label>
                        <Select
                          value={
                            (selectedConfig.layout ?? "single") as InspectorLayout
                          }
                          onValueChange={(value: InspectorLayout) =>
                            updateBoundaryConfig((prev) => ({
                              ...prev,
                              layout: value,
                            }))
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
                  )}
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <GlobalColumnSettingsPanel
                    dataSource={selectedDataSource}
                    boundaryConfig={selectedConfig}
                    getLatestView={getLatestView}
                    updateView={updateView}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6">
                Select a data source to edit column settings and choose whether it
                appears in the inspector.
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
              onReorderColumns={handleReorderColumns}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
