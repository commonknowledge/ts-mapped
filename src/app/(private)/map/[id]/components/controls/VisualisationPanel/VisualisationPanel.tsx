import { Palette, X } from "lucide-react";
import { useChoropleth } from "@/app/(private)/map/[id]/hooks/useChoropleth";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { DEFAULT_CUSTOM_COLOR, DUMMY_COUNT_COLUMN } from "@/constants";
import { useChoroplethDataSource } from "@/hooks/useDataSources";
import { useEditColumnMetadata } from "@/hooks/useEditColumnMetadata";
import { ColumnType } from "@/models/DataSource";
import {
  ColorScaleType,
  ColorScheme,
  MapType,
  mapTypes,
} from "@/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
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
import { CHOROPLETH_COLOR_SCHEMES } from "../../../colors";
import { VISUALISATION_PANEL_WIDTH } from "../../../styles";
import SteppedColorEditor from "./SteppedColorEditor";

const SELECT_TO_BUTTON_CLASSES =
  "bg-background hover:bg-accent hover:text-accent-foreground hover:border-border font-medium cursor-pointer";

function OpacityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const clampValue = (v: number) =>
    isNaN(v) ? 80 : Math.max(0, Math.min(v, 100));
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <input
          type="range"
          id="choropleth-opacity"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={(e) => onChange(clampValue(Number(e.target.value)))}
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-neutral-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:appearance-none"
          style={{
            background: `linear-gradient(to right, #737373 0%, #737373 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
          }}
        />
      </div>
      <Input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(clampValue(Number(e.target.value)))}
        className="w-16"
      />
    </div>
  );
}

function SetCategoryColorsButton() {
  const { viewConfig } = useMapViews();
  const [, setEditColumnMetadata] = useEditColumnMetadata();

  return (
    <Button
      variant="outline"
      className="w-full justify-start"
      onClick={() => {
        if (viewConfig.areaDataSourceId && viewConfig.areaDataColumn) {
          setEditColumnMetadata({
            dataSourceId: viewConfig.areaDataSourceId,
            column: viewConfig.areaDataColumn,
            fields: {
              valueLabels: true,
              valueColors: true,
            },
          });
        }
      }}
    >
      Set category colors
    </Button>
  );
}

export default function VisualisationPanel({
  positionLeft,
}: {
  positionLeft: number;
}) {
  const { viewConfig, updateViewConfig } = useMapViews();
  const { boundariesPanelOpen, setBoundariesPanelOpen } = useChoropleth();
  const dataSource = useChoroplethDataSource();

  if (!boundariesPanelOpen) return null;

  const isCount = viewConfig.areaDataColumn === DUMMY_COUNT_COLUMN;

  const columnOneIsNumber =
    dataSource?.columnDefs.find((c) => c.name === viewConfig.areaDataColumn)
      ?.type === ColumnType.Number;
  const columnOneIsNotNumber = viewConfig.areaDataColumn && !columnOneIsNumber;

  const isCategorical =
    viewConfig.colorScaleType === ColorScaleType.Categorical ||
    columnOneIsNotNumber;

  const showStyle = !viewConfig.areaDataSecondaryColumn;
  const canSelectColorScale = isCount || columnOneIsNumber;
  const canSelectColorScheme = canSelectColorScale && !isCategorical;
  const canSetCategoryColors = isCategorical;

  const hasDataSource = Boolean(viewConfig.areaDataSourceId);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-3 bg-neutral-50 w-80 overflow-y-auto border-r border-neutral-200",
        "absolute top-0 h-full z-100",
      )}
      style={{
        left: positionLeft,
        minWidth: VISUALISATION_PANEL_WIDTH,
        width: VISUALISATION_PANEL_WIDTH,
      }}
    >
      <div className="flex justify-between items-start gap-6 / text-sm">
        <h3 className="mt-2 font-medium">Style settings</h3>
        <button
          aria-label="Close visualisation panel"
          className="text-muted-foreground hover:text-primary cursor-pointer"
          onClick={() => setBoundariesPanelOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <Separator />

      {!hasDataSource ? (
        <p className="text-xs text-muted-foreground">
          Select a data source and column from the legend panel to configure
          style options.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Layout</p>
            <div className="flex gap-2">
              {mapTypes.map((type) => {
                const isDefault = !viewConfig.mapType && type === MapType.Geo;
                const isChecked = viewConfig.mapType === type || isDefault;
                return (
                  <button
                    key={type}
                    type="button"
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-xs font-medium shadow-xs transition-colors",
                      "hover:bg-accent hover:text-accent-foreground hover:border-border",
                      isChecked && "border-blue-300",
                    )}
                    onClick={() => updateViewConfig({ mapType: type })}
                  >
                    {type === MapType.Hex ? "Hex map" : "Geographic"}
                  </button>
                );
              })}
            </div>
          </div>

          {showStyle && (
            <div className="space-y-2 mb-4">
              <p className="flex gap-2 items-center text-sm font-medium">
                <Palette className="w-4 h-4 text-muted-foreground" />
                Style
              </p>

              <div className="grid grid-cols-[auto_minmax(200px,1fr)] gap-2 items-center">
                {canSelectColorScale && (
                  <>
                    <Label
                      htmlFor="color-scale-type-select"
                      className="text-sm text-muted-foreground font-normal"
                    >
                      Color scale
                    </Label>

                    <Select
                      value={
                        viewConfig.colorScaleType || ColorScaleType.Gradient
                      }
                      onValueChange={(value) =>
                        updateViewConfig({
                          colorScaleType: value as ColorScaleType,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full min-w-0",
                          SELECT_TO_BUTTON_CLASSES,
                        )}
                        id="color-scale-type-select"
                      >
                        <SelectValue placeholder="Choose color scale...">
                          {viewConfig.colorScaleType || ColorScaleType.Gradient}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ColorScaleType.Gradient}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-16 h-3 rounded border border-neutral-300"
                              style={{
                                background:
                                  "linear-gradient(to right, #3b82f6, #60a5fa, #93c5fd, #dbeafe)",
                              }}
                            />
                            <span>Gradient</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={ColorScaleType.Stepped}>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-3 rounded border border-neutral-300 overflow-hidden flex">
                              <div
                                className="h-full flex-1 border-r border-neutral-400"
                                style={{ backgroundColor: "#3b82f6" }}
                              />
                              <div
                                className="h-full flex-1 border-r border-neutral-400"
                                style={{ backgroundColor: "#60a5fa" }}
                              />
                              <div
                                className="h-full flex-1 border-r border-neutral-400"
                                style={{ backgroundColor: "#93c5fd" }}
                              />
                              <div
                                className="h-full flex-1"
                                style={{ backgroundColor: "#dbeafe" }}
                              />
                            </div>
                            <span>Stepped</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={ColorScaleType.Categorical}>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-3 rounded border border-neutral-300 overflow-hidden flex">
                              <div
                                className="h-full flex-1 border-r border-neutral-400"
                                style={{ backgroundColor: "#1f77b4" }}
                              />
                              <div
                                className="h-full flex-1 border-r border-neutral-400"
                                style={{ backgroundColor: "#ff7f0e" }}
                              />
                              <div
                                className="h-full flex-1 border-r border-neutral-400"
                                style={{ backgroundColor: "#2ca02c" }}
                              />
                              <div
                                className="h-full flex-1"
                                style={{ backgroundColor: "#d62728" }}
                              />
                            </div>
                            <span>Categorical</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {canSelectColorScheme && (
                      <>
                        <Label
                          htmlFor="choropleth-color-scheme-select"
                          className="text-sm text-muted-foreground font-normal"
                        >
                          Colour scheme
                        </Label>

                        <Select
                          value={viewConfig.colorScheme || ColorScheme.RedBlue}
                          onValueChange={(value) =>
                            updateViewConfig({
                              colorScheme: value as ColorScheme,
                            })
                          }
                        >
                          <SelectTrigger
                            className="w-full min-w-0"
                            id="choropleth-color-scheme-select"
                          >
                            <SelectValue placeholder="Choose colour scheme..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CHOROPLETH_COLOR_SCHEMES.map((option, index) => {
                              const isCustom =
                                option.value === ColorScheme.Custom;
                              const customColorValue = isCustom
                                ? viewConfig.customColor || "#3b82f6"
                                : undefined;
                              return (
                                <SelectItem
                                  key={index}
                                  value={option.value}
                                  className="flex items-center gap-2"
                                >
                                  {isCustom && customColorValue ? (
                                    <div
                                      className="w-4 h-4 rounded"
                                      style={{
                                        background: `linear-gradient(to right, white, ${customColorValue})`,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className={`w-4 h-4 rounded ${option.color}`}
                                    />
                                  )}
                                  <span className="truncate">
                                    {option.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        {viewConfig.colorScheme === ColorScheme.Custom && (
                          <>
                            <Label
                              htmlFor="custom-color-picker"
                              className="text-sm text-muted-foreground font-normal"
                            >
                              Max color
                            </Label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-10 h-10 rounded border border-neutral-300 shrink-0 relative"
                                style={{
                                  backgroundColor:
                                    viewConfig.customColor ||
                                    DEFAULT_CUSTOM_COLOR,
                                }}
                              >
                                <input
                                  type="color"
                                  id="custom-color-picker"
                                  value={
                                    viewConfig.customColor ||
                                    DEFAULT_CUSTOM_COLOR
                                  }
                                  onChange={(e) =>
                                    updateViewConfig({
                                      customColor: e.target.value,
                                    })
                                  }
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  title="Choose color for max value"
                                />
                              </div>
                              <Input
                                type="text"
                                value={
                                  viewConfig.customColor || DEFAULT_CUSTOM_COLOR
                                }
                                onChange={(e) =>
                                  updateViewConfig({
                                    customColor: e.target.value,
                                  })
                                }
                                className="flex-1"
                                placeholder={DEFAULT_CUSTOM_COLOR}
                              />
                            </div>
                          </>
                        )}

                        <Label
                          htmlFor="choropleth-color-scheme-switch"
                          className="text-sm text-muted-foreground font-normal"
                        >
                          Reverse
                        </Label>

                        <Switch
                          id="choropleth-color-scheme-switch"
                          checked={Boolean(viewConfig.reverseColorScheme)}
                          onCheckedChange={(v) =>
                            updateViewConfig({ reverseColorScheme: v })
                          }
                        />

                        {viewConfig.colorScaleType ===
                          ColorScaleType.Stepped && (
                          <>
                            <Label className="text-sm text-muted-foreground font-normal">
                              Color steps
                            </Label>
                            <div>
                              <SteppedColorEditor />
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                {canSetCategoryColors && (
                  <>
                    <Label className="text-sm text-muted-foreground font-normal">
                      Category colors
                    </Label>
                    <div>
                      <SetCategoryColorsButton />
                    </div>
                  </>
                )}
                <Label
                  htmlFor="choropleth-opacity"
                  className="text-sm text-muted-foreground font-normal"
                >
                  Opacity (%)
                </Label>
                <OpacityControl
                  value={viewConfig.choroplethOpacityPct ?? 80}
                  onChange={(v) =>
                    updateViewConfig({ choroplethOpacityPct: v })
                  }
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
