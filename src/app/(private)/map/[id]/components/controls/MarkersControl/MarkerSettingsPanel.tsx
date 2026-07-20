"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDataSourceListCache } from "@/app/(private)/hooks/useDataSourceListCache";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import ColorPalette from "@/components/ColorPalette";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import {
  MarkerColorMode,
  MarkerDisplayMode,
  MarkerIconMode,
  MarkerSizeMode,
} from "@/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Label } from "@/shadcn/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";
import { useMapConfig } from "../../../hooks/useMapConfig";
import { useMapRef } from "../../../hooks/useMapCore";
import { useMapViews } from "../../../hooks/useMapViews";
import { useMarkerSettings } from "../../../hooks/useMarkerSettings";
import { VISUALISATION_PANEL_WIDTH, mapColors } from "../../../styles";
import MarkerMappingFlyout from "./MarkerMappingFlyout";
import type { MarkerMappingKind } from "./MarkerMappingFlyout";

const NONE_VALUE = "__none__";

export default function MarkerSettingsPanel({
  positionLeft,
}: {
  positionLeft: number;
}) {
  const {
    markerSettingsDataSourceId,
    setMarkerSettingsDataSourceId,
    getMarkerVisualisation,
    patchMarkerVisualisation,
  } = useMarkerSettings();
  const { getDataSourceById } = useDataSources();
  const { mapConfig } = useMapConfig();
  const { viewConfig, updateViewConfig } = useMapViews();
  const organisationId = useOrganisationId();
  const trpc = useTRPC();
  const {
    invalidateAll: invalidateDataSources,
    updateDataSource: patchDataSourceCache,
  } = useDataSourceListCache();

  const dataSourceId = markerSettingsDataSourceId ?? "";
  const dataSource = getDataSourceById(dataSourceId);
  const visualisation = getMarkerVisualisation(dataSourceId);

  const iconColumn = visualisation.iconColumn ?? "";
  const iconsEnabled =
    visualisation.iconMode === MarkerIconMode.Categories && Boolean(iconColumn);

  // Value-mapping editor shown beside the panel; closed when the panel
  // switches to a different data source
  const [mappingFlyout, setMappingFlyout] = useState<MarkerMappingKind | null>(
    null,
  );
  useEffect(() => {
    setMappingFlyout(null);
  }, [dataSourceId]);

  const { mutate: updateDefaultMarkerColor } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onError: () => {
        toast.error("Failed to update marker colour");
        void invalidateDataSources();
      },
    }),
  );

  const mapRef = useMapRef();
  // Clustering controls are locked while the map re-indexes
  const [reclustering, setReclustering] = useState(false);
  const reclusteringPollRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (reclusteringPollRef.current !== null) {
        window.clearInterval(reclusteringPollRef.current);
      }
    },
    [],
  );

  // Only show settings for sources actually on the map — a source can be
  // removed from the map while its settings panel is open
  const isOnMap =
    mapConfig.markerDataSourceIds.includes(dataSourceId) ||
    mapConfig.membersDataSourceId === dataSourceId;

  if (!markerSettingsDataSourceId || !dataSource || !isOnMap) {
    return null;
  }

  const patch = (update: Parameters<typeof patchMarkerVisualisation>[1]) =>
    patchMarkerVisualisation(dataSourceId, update);

  // Lock the clustering control until the map has finished re-indexing after
  // a change that toggles the source's cluster state. Completion is detected
  // by polling the GeoJSON source itself — the map-wide "idle" event is
  // unreliable because it requires every source on the map to be loaded, not
  // just this one.
  const lockWhileReclustering = () => {
    const map = mapRef?.current?.getMap();
    if (!map) {
      return;
    }
    setReclustering(true);
    if (reclusteringPollRef.current !== null) {
      window.clearInterval(reclusteringPollRef.current);
    }
    // A cluster-state change re-creates the source (new object identity),
    // so: done once the new source exists and has finished indexing. The
    // time cap is a backstop so the controls can never lock permanently.
    const sourceId = `${dataSourceId}-markers`;
    const oldSource = map.getSource(sourceId);
    const startedAt = Date.now();
    const poll = window.setInterval(() => {
      const source = map.getSource(sourceId);
      const swapped = Boolean(source) && source !== oldSource;
      const timedOut = Date.now() - startedAt > 30_000;
      if ((swapped && map.isSourceLoaded(sourceId)) || timedOut) {
        window.clearInterval(poll);
        reclusteringPollRef.current = null;
        setReclustering(false);
      }
    }, 250);
    reclusteringPollRef.current = poll;
  };

  const displayMode = visualisation.displayMode ?? MarkerDisplayMode.Circles;

  const handleDisplayModeChange = (mode: MarkerDisplayMode) => {
    const wasClustered = displayMode === MarkerDisplayMode.Circles;
    patch({ displayMode: mode });
    if (wasClustered !== (mode === MarkerDisplayMode.Circles)) {
      lockWhileReclustering();
    }
  };

  // Default colour: view override, then data source default, then layer colour
  const layerColor =
    mapConfig.membersDataSourceId === dataSourceId
      ? mapColors.member.color
      : mapColors.markers.color;
  const currentColor =
    viewConfig.markerColors?.[dataSourceId] ??
    dataSource.defaultMarkerColor ??
    layerColor;

  const isOwner = Boolean(
    organisationId && dataSource.organisationId === organisationId,
  );

  const handleColorChange = (color: string) => {
    // Set the colour for this view; views with their own colour keep it
    updateViewConfig({
      markerColors: {
        ...viewConfig.markerColors,
        [dataSourceId]: color,
      },
    });
    if (isOwner) {
      // Owners also update the data source's default colour, used by any
      // view or map that has not set its own (including future ones)
      patchDataSourceCache(dataSourceId, (ds) => ({
        ...ds,
        defaultMarkerColor: color,
      }));
      updateDefaultMarkerColor({
        dataSourceId,
        defaultMarkerColor: color,
      });
    }
  };

  const stringColumns = dataSource.columnDefs.filter(
    (c) => c.type === ColumnType.String,
  );

  const toggleMappingFlyout = (kind: MarkerMappingKind) =>
    setMappingFlyout((current) => (current === kind ? null : kind));

  // The flyout edits the column driving the open mapping; it disappears if
  // that column is deselected or its section's mode is switched off
  const mappingFlyoutColumn =
    mappingFlyout === "icons"
      ? iconsEnabled
        ? iconColumn
        : ""
      : mappingFlyout === "colors"
        ? visualisation.colorMode === MarkerColorMode.Categories
          ? (visualisation.colorColumn ?? "")
          : ""
        : mappingFlyout === "order"
          ? visualisation.sizeMode === MarkerSizeMode.Scaled
            ? (visualisation.sizeColumn ?? "")
            : ""
          : "";

  const columnSelect = (
    value: string | undefined,
    onChange: (column: string | undefined) => void,
  ) => (
    <Select
      value={value || NONE_VALUE}
      onValueChange={(v) => onChange(v === NONE_VALUE ? undefined : v)}
    >
      <SelectTrigger className="w-full bg-white">
        <SelectValue placeholder="Select column" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>None</SelectItem>
        {stringColumns.map((c) => (
          <SelectItem key={c.name} value={c.name}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const defaultColorRow = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs">Default colour</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Choose default colour"
            className="w-7 h-7 rounded border border-neutral-300 cursor-pointer shrink-0"
            style={{ backgroundColor: currentColor }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <ColorPalette
            selectedColor={currentColor}
            onColorSelect={handleColorChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <>
      {mappingFlyout && mappingFlyoutColumn && (
        <MarkerMappingFlyout
          kind={mappingFlyout}
          dataSourceId={dataSourceId}
          column={mappingFlyoutColumn}
          positionLeft={positionLeft + VISUALISATION_PANEL_WIDTH}
          onClose={() => setMappingFlyout(null)}
        />
      )}
      <div
        className={cn(
          "flex flex-col gap-4 p-3 bg-neutral-50 overflow-y-auto border-r border-neutral-200",
          "absolute top-0 h-full z-100",
        )}
        style={{
          left: positionLeft,
          minWidth: VISUALISATION_PANEL_WIDTH,
          width: VISUALISATION_PANEL_WIDTH,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Marker settings</h2>
            <p className="text-xs text-muted-foreground truncate">
              {dataSource.name}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close marker settings"
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => setMarkerSettingsDataSourceId(null)}
          >
            <X size={16} />
          </button>
        </div>

        <Separator />

        {/* Clustering: how the layer aggregates at low zoom. Individual
          markers always show at high zoom and use the styling below. */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-1.5">
            Clustering
            {reclustering && (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            )}
          </Label>
          <Select
            value={displayMode}
            disabled={reclustering}
            onValueChange={(v) =>
              handleDisplayModeChange(v as MarkerDisplayMode)
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MarkerDisplayMode.Circles}>Circles</SelectItem>
              <SelectItem value={MarkerDisplayMode.Heatmap}>Heatmap</SelectItem>
              <SelectItem value={MarkerDisplayMode.Overlap}>Overlap</SelectItem>
              <SelectItem value={MarkerDisplayMode.None}>None</SelectItem>
            </SelectContent>
          </Select>
          {reclustering && (
            <p className="text-xs text-muted-foreground">Updating clusters…</p>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-mono uppercase text-muted-foreground">
            Colour
          </Label>
          {displayMode === MarkerDisplayMode.Heatmap && (
            <p className="text-xs text-muted-foreground">
              The heatmap uses a fixed density ramp; colours apply to the
              individual markers shown when zoomed in.
            </p>
          )}
          <Select
            value={
              visualisation.colorMode === MarkerColorMode.Categories
                ? MarkerColorMode.Categories
                : MarkerColorMode.Single
            }
            onValueChange={(v) =>
              patch({
                colorMode:
                  v === MarkerColorMode.Categories
                    ? MarkerColorMode.Categories
                    : MarkerColorMode.Single,
              })
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MarkerColorMode.Single}>
                Single colour
              </SelectItem>
              <SelectItem value={MarkerColorMode.Categories}>
                By category
              </SelectItem>
            </SelectContent>
          </Select>
          {visualisation.colorMode === MarkerColorMode.Categories ? (
            <>
              {columnSelect(visualisation.colorColumn, (column) =>
                patch({ colorColumn: column }),
              )}
              {visualisation.colorColumn && (
                <Button
                  variant={mappingFlyout === "colors" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleMappingFlyout("colors")}
                >
                  Set category colours
                </Button>
              )}
            </>
          ) : (
            defaultColorRow
          )}
        </div>

        <Separator />

        {/* Icon */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-mono uppercase text-muted-foreground">
            Icon
          </Label>
          <Select
            value={
              visualisation.iconMode === MarkerIconMode.Categories
                ? MarkerIconMode.Categories
                : MarkerIconMode.None
            }
            onValueChange={(v) =>
              patch({
                iconMode:
                  v === MarkerIconMode.Categories
                    ? MarkerIconMode.Categories
                    : MarkerIconMode.None,
              })
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MarkerIconMode.None}>Simple</SelectItem>
              <SelectItem value={MarkerIconMode.Categories}>
                By category
              </SelectItem>
            </SelectContent>
          </Select>
          {visualisation.iconMode === MarkerIconMode.Categories && (
            <>
              {columnSelect(visualisation.iconColumn, (column) =>
                patch({ iconColumn: column }),
              )}
              {iconsEnabled && (
                <Button
                  variant={mappingFlyout === "icons" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleMappingFlyout("icons")}
                >
                  Set category icons
                </Button>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Size */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-mono uppercase text-muted-foreground">
            Size
          </Label>
          <Select
            value={
              visualisation.sizeMode === MarkerSizeMode.Scaled
                ? MarkerSizeMode.Scaled
                : MarkerSizeMode.Fixed
            }
            onValueChange={(v) =>
              patch({
                sizeMode:
                  v === MarkerSizeMode.Scaled
                    ? MarkerSizeMode.Scaled
                    : MarkerSizeMode.Fixed,
              })
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MarkerSizeMode.Fixed}>Fixed</SelectItem>
              <SelectItem value={MarkerSizeMode.Scaled}>Scaled</SelectItem>
            </SelectContent>
          </Select>
          {visualisation.sizeMode === MarkerSizeMode.Scaled && (
            <>
              {columnSelect(visualisation.sizeColumn, (column) =>
                patch({ sizeColumn: column }),
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Sort</span>
                <Select
                  value={visualisation.sizeSortDesc ? "desc" : "asc"}
                  onValueChange={(v) => patch({ sizeSortDesc: v === "desc" })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {visualisation.sizeColumn && (
                <Button
                  variant={mappingFlyout === "order" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggleMappingFlyout("order")}
                >
                  Set value order
                </Button>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Display */}
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-mono uppercase text-muted-foreground">
            Display
          </Label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">Opacity</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={visualisation.opacityPct ?? 100}
                onChange={(e) => patch({ opacityPct: Number(e.target.value) })}
              />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {visualisation.opacityPct ?? 100}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">Labels</span>
            <Switch
              checked={visualisation.showLabels !== false}
              onCheckedChange={(checked) => patch({ showLabels: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">Show legend</span>
            <Switch
              checked={Boolean(visualisation.legend?.show)}
              onCheckedChange={(checked) =>
                patch({ legend: { show: checked } })
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
