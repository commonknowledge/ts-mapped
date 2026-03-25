import { CircleAlert, Database, Palette, PieChart, X } from "lucide-react";
import { useState } from "react";
import { useChoropleth } from "@/app/(private)/map/[id]/hooks/useChoropleth";
import {
  useChoroplethDataSource,
  useDataSources,
} from "@/app/(private)/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { DEFAULT_CUSTOM_COLOR, MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import { AreaSetGroupCodeLabels, AreaSetGroupCodeYears } from "@/labels";
import { ColumnType } from "@/models/DataSource";
import {
  CalculationType,
  ColorScaleType,
  ColorScheme,
  DEFAULT_CALCULATION_TYPE,
} from "@/models/MapView";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Combobox } from "@/shadcn/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { DialogTrigger } from "@/shadcn/ui/dialog";
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
import { resolveColumnMetadataEntry } from "@/utils/resolveColumnMetadata";
import { CHOROPLETH_COLOR_SCHEMES } from "../../../colors";
import { useEditColumnMetadata } from "../../../hooks/useEditColumnMetadata";
import {
  dataRecordsWillAggregate,
  getValidAreaSetGroupCodes,
} from "../../Choropleth/areas";
import DataSourceSelectButton from "../../DataSourceSelectButton";
import SteppedColorEditor from "./SteppedColorEditor";
import type { AreaSetGroupCode } from "@/models/AreaSet";
import type { DataSource } from "@/models/DataSource";

const SELECT_TO_BUTTON_CLASSES =
  "bg-background hover:bg-accent hover:text-accent-foreground hover:border-border font-medium cursor-pointer";

function IncludeColumnsModal({
  dataSource,
  selectedColumns,
  onColumnsChange,
}: {
  dataSource: DataSource;
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const numericColumns = dataSource.columnDefs.filter(
    (c) => c.type === ColumnType.Number,
  );

  const handleToggle = (columnName: string, checked: boolean) => {
    if (checked) {
      onColumnsChange([...selectedColumns, columnName]);
    } else {
      onColumnsChange(selectedColumns.filter((c) => c !== columnName));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Include columns (leave empty to use all numeric columns)
        </Label>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {selectedColumns.length > 0
              ? `${selectedColumns.length} column${
                  selectedColumns.length !== 1 ? "s" : ""
                } selected`
              : "Select columns to include"}
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select columns to include</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <p className="text-sm text-gray-500 mb-4">
            Only selected columns will be considered when determining the
            highest value column for each area. Leave empty to use all numeric
            columns.
          </p>
          <div className="space-y-2">
            {numericColumns.map((column) => (
              <div
                key={column.name}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
              >
                <Checkbox
                  id={`column-${column.name}`}
                  checked={selectedColumns.includes(column.name)}
                  onCheckedChange={(checked) =>
                    handleToggle(column.name, checked === true)
                  }
                />
                <label
                  htmlFor={`column-${column.name}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {column.name}
                </label>
              </div>
            ))}
          </div>
          {numericColumns.length === 0 && (
            <p className="text-sm text-gray-500">
              No numeric columns found in this data source.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  const { data: dataSources, getDataSourceById } = useDataSources();
  const dataSource = useChoroplethDataSource();

  const [invalidDataSourceId, setInvalidDataSourceId] = useState<string | null>(
    null,
  );

  if (!boundariesPanelOpen) return null;

  const isCount = viewConfig.calculationType === CalculationType.Count;

  const columnOneIsNumber =
    dataSource?.columnDefs.find((c) => c.name === viewConfig.areaDataColumn)
      ?.type === ColumnType.Number;
  const columnOneIsNotNumber = viewConfig.areaDataColumn && !columnOneIsNumber;

  const isCategorical =
    viewConfig.colorScaleType === ColorScaleType.Categorical ||
    columnOneIsNotNumber;

  const canSelectColumn = !isCount && viewConfig.areaDataSourceId;
  const canSelectSecondaryColumn = !isCount && columnOneIsNumber;
  const canSelectAggregation =
    !isCount &&
    columnOneIsNumber &&
    dataRecordsWillAggregate(
      dataSource?.geocodingConfig,
      viewConfig.areaSetGroupCode,
    );
  const showStyle = !viewConfig.areaDataSecondaryColumn;
  const canSelectColorScale = isCount || columnOneIsNumber;
  const canSelectColorScheme = canSelectColorScale && !isCategorical;
  const canSetCategoryColors = isCategorical;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-3 bg-neutral-50 w-80 overflow-y-auto border-r border-neutral-200",
        "absolute top-0 h-full z-100",
      )}
      style={{
        left: positionLeft,
      }}
    >
      <div className="flex justify-between items-start gap-6 / text-sm">
        <h3 className="mt-2 font-medium">Create visualisation</h3>
        <button
          aria-label="Close visualisation panel"
          className="text-muted-foreground hover:text-primary cursor-pointer"
          onClick={() => setBoundariesPanelOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <Separator />

      {/* Data Source Selection */}
      <div className="space-y-2 mb-4 group">
        <Label className="text-sm">
          <Database className="w-4 h-4 text-muted-foreground" /> Data source
        </Label>
        <DataSourceSelectButton
          className="w-full"
          dataSource={dataSource}
          onClickRemove={() =>
            updateViewConfig({
              areaDataSourceId: "",
              areaDataColumn: "",
              calculationType: undefined,
            })
          }
          onSelect={(dataSourceId) => {
            const selectedAreaSetGroup = viewConfig.areaSetGroupCode;
            if (!selectedAreaSetGroup) {
              updateViewConfig({
                areaDataSourceId: dataSourceId,
                areaDataSecondaryColumn: undefined,
              });
              return;
            }
            const dataSource = getDataSourceById(dataSourceId);
            const validAreaSetGroups = getValidAreaSetGroupCodes(
              dataSource?.geocodingConfig,
            );
            if (validAreaSetGroups.includes(selectedAreaSetGroup)) {
              updateViewConfig({
                areaDataSourceId: dataSourceId,
                areaDataSecondaryColumn: undefined,
              });
              return;
            }
            setInvalidDataSourceId(dataSourceId);
          }}
        />
      </div>

      <div className="space-y-2 mb-4">
        <p className="flex gap-2 items-center text-sm font-medium">
          <PieChart className="w-4 h-4 text-muted-foreground" />
          Visualisation
        </p>

        <div className="grid grid-cols-[auto_minmax(200px,1fr)] gap-2 items-center">
          <Label
            htmlFor="choropleth-boundary-select"
            className="text-sm text-muted-foreground font-normal"
          >
            Boundaries
          </Label>

          <Select
            value={viewConfig.areaSetGroupCode || NULL_UUID}
            onValueChange={(value) =>
              updateViewConfig({
                areaSetGroupCode:
                  value === NULL_UUID ? null : (value as AreaSetGroupCode),
              })
            }
          >
            <SelectTrigger
              className={cn("w-full min-w-0", SELECT_TO_BUTTON_CLASSES)}
              id="choropleth-boundary-select"
            >
              <SelectValue placeholder="Choose boundaries...">
                {viewConfig.areaSetGroupCode
                  ? AreaSetGroupCodeLabels[viewConfig.areaSetGroupCode]
                  : "No locality"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_UUID}>No locality</SelectItem>
              {getValidAreaSetGroupCodes(dataSource?.geocodingConfig).map(
                (code) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex flex-col">
                      <span className="">
                        {AreaSetGroupCodeLabels[code as AreaSetGroupCode]}
                      </span>
                      <span
                        className="text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html:
                            AreaSetGroupCodeYears[code as AreaSetGroupCode],
                        }}
                      />
                    </div>
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Label
            htmlFor="choropleth-calculation-select"
            className="text-sm text-muted-foreground font-normal"
          >
            Display
          </Label>

          <Select
            value={
              viewConfig.calculationType === CalculationType.Count
                ? "counts"
                : "values"
            }
            onValueChange={(value) =>
              updateViewConfig({
                calculationType:
                  value === "counts"
                    ? CalculationType.Count
                    : DEFAULT_CALCULATION_TYPE,
              })
            }
          >
            <SelectTrigger
              className={cn("w-full min-w-0", SELECT_TO_BUTTON_CLASSES)}
              id="choropleth-calculation-select"
            >
              <SelectValue placeholder="Choose calculation..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="counts">Count by area</SelectItem>
              <SelectItem value="values">Data values</SelectItem>
            </SelectContent>
          </Select>

          {canSelectColumn && (
            <>
              <Label
                htmlFor="choropleth-column-1-select"
                className="text-sm text-muted-foreground font-normal"
              >
                {viewConfig.areaDataSecondaryColumn !== undefined &&
                viewConfig.areaDataSecondaryColumn !== ""
                  ? "Column 1"
                  : "Column"}
              </Label>
              <Combobox
                options={[
                  { value: NULL_UUID, label: "None" },
                  {
                    value: MAX_COLUMN_KEY,
                    label: "Highest-value column (String)",
                  },
                  ...(dataSources
                    ?.find((ds) => ds.id === viewConfig.areaDataSourceId)
                    ?.columnDefs.map((col) => ({
                      value: col.name,
                      label: `${col.name} (${col.type})`,
                      hint: resolveColumnMetadataEntry(
                        dataSource?.columnMetadata || [],
                        dataSource?.organisationOverride?.columnMetadata,
                        col.name,
                      )?.description,
                    })) || []),
                ]}
                value={viewConfig.areaDataColumn || NULL_UUID}
                onValueChange={(value) =>
                  updateViewConfig({
                    areaDataColumn: value === NULL_UUID ? "" : value,
                  })
                }
                placeholder="Choose a column..."
                searchPlaceholder="Search columns..."
              />
            </>
          )}

          {canSelectSecondaryColumn && (
            <>
              <Label
                htmlFor="choropleth-column-2-select"
                className="text-sm text-muted-foreground font-normal"
              >
                Column 2
              </Label>
              <div className="flex items-center gap-2">
                <Combobox
                  options={[
                    { value: NULL_UUID, label: "None" },
                    ...(dataSources
                      ?.find((ds) => ds.id === viewConfig.areaDataSourceId)
                      ?.columnDefs.filter(
                        (col) =>
                          col.type === ColumnType.Number &&
                          col.name !== viewConfig.areaDataColumn,
                      )
                      .map((col) => ({
                        value: col.name,
                        label: `${col.name} (${col.type})`,
                        hint: resolveColumnMetadataEntry(
                          dataSource?.columnMetadata || [],
                          dataSource?.organisationOverride?.columnMetadata,
                          col.name,
                        )?.description,
                      })) || []),
                  ]}
                  value={viewConfig.areaDataSecondaryColumn || NULL_UUID}
                  onValueChange={(value) =>
                    updateViewConfig({
                      areaDataSecondaryColumn:
                        value === NULL_UUID ? undefined : value,
                    })
                  }
                  placeholder="Choose a column..."
                  searchPlaceholder="Search columns..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => {
                    updateViewConfig({ areaDataSecondaryColumn: undefined });
                  }}
                  title="Remove column 2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {viewConfig.areaDataSecondaryColumn && (
                <div className="col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full justify-start"
                    onClick={() => {
                      updateViewConfig({ areaDataSecondaryColumn: undefined });
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove bivariate visualization
                  </Button>
                </div>
              )}
            </>
          )}

          {canSelectAggregation && (
            <>
              <Label
                htmlFor="choropleth-aggregation-select"
                className="text-sm text-muted-foreground font-normal"
              >
                Aggregation
              </Label>
              <Select
                value={viewConfig.calculationType || ""}
                onValueChange={(value) =>
                  updateViewConfig({
                    calculationType: value as CalculationType,
                  })
                }
              >
                <SelectTrigger
                  className={cn("w-full min-w-0", SELECT_TO_BUTTON_CLASSES)}
                  id="choropleth-aggregation-select"
                >
                  <SelectValue placeholder="Choose an aggregation..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CalculationType.Avg}>Average</SelectItem>
                  <SelectItem value={CalculationType.Mode}>
                    Most common
                  </SelectItem>
                  <SelectItem value={CalculationType.Sum}>Sum</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        {!viewConfig.areaDataSourceId && (
          <div className="flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-gray-500">
              No data source selected. Please select a data source to create a
              choropleth.
            </p>
          </div>
        )}
        {viewConfig.areaDataSourceId && !viewConfig.areaSetGroupCode && (
          <div className="flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-gray-500">
              No locality shapes selected. Please select a locality set to
              render the filled map.
            </p>
          </div>
        )}

        {/* Include Columns Modal - only show when MAX_COLUMN_KEY is selected */}
        {viewConfig.areaDataColumn === MAX_COLUMN_KEY && dataSource && (
          <IncludeColumnsModal
            dataSource={dataSource}
            selectedColumns={
              viewConfig.includeColumnsString
                ? viewConfig.includeColumnsString
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                : []
            }
            onColumnsChange={(columns) => {
              updateViewConfig({
                includeColumnsString:
                  columns.length > 0 ? columns.join(",") : undefined,
              });
            }}
          />
        )}
      </div>

      {showStyle && (
        <div className="space-y-2 mb-4">
          {/* Color Scheme Selection */}

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
                  value={viewConfig.colorScaleType || ColorScaleType.Gradient}
                  onValueChange={(value) =>
                    updateViewConfig({
                      colorScaleType: value as ColorScaleType,
                    })
                  }
                >
                  <SelectTrigger
                    className={cn("w-full min-w-0", SELECT_TO_BUTTON_CLASSES)}
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
                          const isCustom = option.value === ColorScheme.Custom;
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
                              <span className="truncate">{option.label}</span>
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
                            className="w-10 h-10 rounded border border-neutral-300 flex-shrink-0 relative"
                            style={{
                              backgroundColor:
                                viewConfig.customColor || DEFAULT_CUSTOM_COLOR,
                            }}
                          >
                            <input
                              type="color"
                              id="custom-color-picker"
                              value={
                                viewConfig.customColor || DEFAULT_CUSTOM_COLOR
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
                              updateViewConfig({ customColor: e.target.value })
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

                    {viewConfig.colorScaleType === ColorScaleType.Stepped && (
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

            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="range"
                  id="choropleth-opacity"
                  min="0"
                  max="100"
                  step="1"
                  value={viewConfig.choroplethOpacityPct ?? 80}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const choroplethOpacityPct = isNaN(v)
                      ? 80
                      : Math.max(0, Math.min(v, 100));
                    updateViewConfig({ choroplethOpacityPct });
                  }}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-neutral-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:appearance-none"
                  style={{
                    background: `linear-gradient(to right, #737373 0%, #737373 ${viewConfig.choroplethOpacityPct ?? 80}%, #e5e7eb ${viewConfig.choroplethOpacityPct ?? 80}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
              <Input
                type="number"
                min="0"
                max="100"
                value={viewConfig.choroplethOpacityPct ?? 80}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  const choroplethOpacityPct = isNaN(v)
                    ? 80
                    : Math.max(0, Math.min(v, 100));
                  updateViewConfig({ choroplethOpacityPct });
                }}
                className="w-16"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for handling invalid data source / boundary combination */}
      <Dialog
        open={Boolean(invalidDataSourceId)}
        onOpenChange={(o) => {
          if (!o) {
            setInvalidDataSourceId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Select new boundaries</DialogTitle>
          </DialogHeader>

          <p>
            The data source you have selected does not fit into your selected
            boundaries (
            {viewConfig.areaSetGroupCode
              ? AreaSetGroupCodeLabels[viewConfig.areaSetGroupCode]
              : "unknown"}
            ). Please select alternative boundaries, or cancel.
          </p>

          <Select
            onValueChange={(value) => {
              updateViewConfig({
                areaSetGroupCode: value as AreaSetGroupCode,
                areaDataSourceId: invalidDataSourceId || "",
              });
              setInvalidDataSourceId(null);
            }}
          >
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Choose boundaries..." />
            </SelectTrigger>
            <SelectContent>
              {getValidAreaSetGroupCodes(
                getDataSourceById(invalidDataSourceId)?.geocodingConfig,
              ).map((code) => (
                <SelectItem key={code} value={code}>
                  {AreaSetGroupCodeLabels[code as AreaSetGroupCode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>
    </div>
  );
}
