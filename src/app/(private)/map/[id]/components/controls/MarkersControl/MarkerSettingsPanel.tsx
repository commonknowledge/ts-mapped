"use client";

import { X } from "lucide-react";
import { useColumnMetadataMutations } from "@/app/(private)/hooks/useColumnMetadataMutations";
import { useOrganisationId } from "@/atoms/organisationAtoms";
import { useColumnValues } from "@/hooks/useColumnValues";
import { useDataSources } from "@/hooks/useDataSources";
import { useEditColumnMetadata } from "@/hooks/useEditColumnMetadata";
import { ColumnType } from "@/models/DataSource";
import {
  MarkerColorMode,
  MarkerIconMode,
  MarkerSizeMode,
} from "@/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { Label } from "@/shadcn/ui/label";
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
import { sortColumnValues } from "@/utils/sortColumnValues";
import { useDataSourceColumn } from "../../../hooks/useDataSourceColumn";
import { useMarkerSettings } from "../../../hooks/useMarkerSettings";
import { VISUALISATION_PANEL_WIDTH } from "../../../styles";
import { markerIconShapes } from "../../Markers/markerIcons";
import { formatCategoryValue } from "../../Markers/markerStyle";
import MarkerShapeIcon from "../../MarkerShapeIcon";

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
  const organisationId = useOrganisationId();
  const { patchColumnMetadata, patchColumnMetadataOverride } =
    useColumnMetadataMutations();
  const [, setEditColumnMetadata] = useEditColumnMetadata();

  const dataSourceId = markerSettingsDataSourceId ?? "";
  const dataSource = getDataSourceById(dataSourceId);
  const visualisation = getMarkerVisualisation(dataSourceId);

  const iconColumn = visualisation.iconColumn ?? "";
  const iconsEnabled =
    visualisation.iconMode === MarkerIconMode.Categories && Boolean(iconColumn);
  const { columnMetadata: iconColumnMetadata, columnDef: iconColumnDef } =
    useDataSourceColumn(dataSourceId, iconColumn);
  const iconColumnValues = useColumnValues({
    dataSourceId,
    column: iconColumn,
    columnType: iconColumnDef?.type ?? ColumnType.Unknown,
    nullIsZero: dataSource?.nullIsZero,
    enabled: Boolean(dataSourceId && iconsEnabled),
  });

  if (!markerSettingsDataSourceId || !dataSource) {
    return null;
  }

  const patch = (update: Parameters<typeof patchMarkerVisualisation>[1]) =>
    patchMarkerVisualisation(dataSourceId, update);

  const stringColumns = dataSource.columnDefs.filter(
    (c) => c.type === ColumnType.String,
  );

  const isOwner = Boolean(
    organisationId && dataSource.organisationId === organisationId,
  );

  const setValueIcon = (value: string, shape: string | null) => {
    const next: Record<string, string> = {};
    for (const [v, s] of Object.entries(iconColumnMetadata?.valueIcons ?? {})) {
      if (v !== value) {
        next[v] = s;
      }
    }
    if (shape) {
      next[value] = shape;
    }
    const metadataPatch = { valueIcons: next };
    if (isOwner) {
      patchColumnMetadata({
        dataSourceId,
        column: iconColumn,
        patch: metadataPatch,
      });
    } else if (organisationId) {
      patchColumnMetadataOverride({
        organisationId,
        dataSourceId,
        column: iconColumn,
        patch: metadataPatch,
      });
    }
  };

  const sortedIconValues = sortColumnValues({
    values: iconColumnValues ?? [],
    columnMetadata: iconColumnMetadata,
  });

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

  return (
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
            {iconsEnabled && iconColumnValues === null && (
              <p className="text-xs text-muted-foreground">
                Too many values in this column to assign icons.
              </p>
            )}
            {iconsEnabled && sortedIconValues.length > 0 && (
              <div className="flex flex-col gap-1">
                {sortedIconValues.map((value) => {
                  const assigned = iconColumnMetadata?.valueIcons?.[value];
                  return (
                    <div
                      key={value}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs truncate" title={value}>
                        {formatCategoryValue(
                          value,
                          iconColumnMetadata?.valueLabels,
                        )}
                      </span>
                      <span className="flex gap-0.5 shrink-0">
                        {markerIconShapes.map((shape) => (
                          <button
                            key={shape}
                            type="button"
                            aria-label={`${shape} icon for ${value}`}
                            className={cn(
                              "p-1 rounded cursor-pointer hover:bg-neutral-200",
                              assigned === shape &&
                                "bg-neutral-800 text-white hover:bg-neutral-700",
                            )}
                            onClick={() =>
                              setValueIcon(
                                value,
                                assigned === shape ? null : shape,
                              )
                            }
                          >
                            <MarkerShapeIcon shape={shape} />
                          </button>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Separator />

      {/* Colour */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-mono uppercase text-muted-foreground">
          Colour
        </Label>
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
        {visualisation.colorMode === MarkerColorMode.Categories && (
          <>
            {columnSelect(visualisation.colorColumn, (column) =>
              patch({ colorColumn: column }),
            )}
            {visualisation.colorColumn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditColumnMetadata({
                    dataSourceId,
                    column: visualisation.colorColumn ?? "",
                    fields: { valueColors: true },
                  })
                }
              >
                Set category colours
              </Button>
            )}
          </>
        )}
        {visualisation.colorMode !== MarkerColorMode.Categories && (
          <p className="text-xs text-muted-foreground">
            Set the colour by right-clicking the layer.
          </p>
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
          </>
        )}
      </div>

      <Separator />

      {/* Clustering */}
      <div className="flex flex-col gap-3">
        <Label className="text-xs font-mono uppercase text-muted-foreground">
          Clustering
        </Label>
        {iconsEnabled ? (
          <p className="text-xs text-muted-foreground">
            Clustering is off while markers use icons.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs">Cluster nearby markers</span>
              <Switch
                checked={visualisation.clusteringEnabled !== false}
                onCheckedChange={(checked) =>
                  patch({ clusteringEnabled: checked })
                }
              />
            </div>
            {visualisation.clusteringEnabled !== false && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs">Stop clustering at zoom</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={22}
                    value={visualisation.clusterMaxZoom ?? 11}
                    onChange={(e) =>
                      patch({ clusterMaxZoom: Number(e.target.value) })
                    }
                  />
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {visualisation.clusterMaxZoom ?? 11}
                  </span>
                </div>
              </div>
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
              patch({ legend: { show: checked, display: [] } })
            }
          />
        </div>
      </div>
    </div>
  );
}
