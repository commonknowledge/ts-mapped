import {
  CircleAlert,
  Database,
  Palette,
  PieChart,
  PlusIcon,
  RotateCwIcon,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import {
  useChoroplethDataSource,
  useDataSources,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import { AreaSetGroupCodeLabels } from "@/labels";
import { ColumnType } from "@/server/models/DataSource";
import {
  CalculationType,
  ColorScaleType,
  ColorScheme,
} from "@/server/models/MapView";
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
import { CHOROPLETH_COLOR_SCHEMES } from "../../../colors";
import {
  dataRecordsWillAggregate,
  getValidAreaSetGroupCodes,
} from "../../Choropleth/areas";
import CategoryColorEditor from "./CategoryColorEditor";
import { DataSourceItem } from "./DataSourceItem";
import SteppedColorEditor from "./SteppedColorEditor";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";
import type { DataSource } from "@/server/models/DataSource";

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
              ? `${selectedColumns.length} column${selectedColumns.length !== 1 ? "s" : ""
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

export default function VisualisationPanel({
  positionLeft,
}: {
  positionLeft: number;
}) {
  const { viewConfig, updateViewConfig } = useMapViews();
  const { boundariesPanelOpen, setBoundariesPanelOpen } = useChoropleth();
  const { data: dataSources, getDataSourceById } = useDataSources();
  const dataSource = useChoroplethDataSource();

  const [activeTab, setActiveTab] = useState<"all" | "public" | "user">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invalidDataSourceId, setInvalidDataSourceId] = useState<string | null>(
    null,
  );

  // Update the filtering logic to include search
  const filteredAndSearchedDataSources = useMemo(() => {
    let sources = dataSources || [];

    if (searchQuery) {
      sources = sources.filter(
        (ds) =>
          ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ds.columnDefs.some((col) =>
            col.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    if (activeTab === "public") {
      // Include only public data sources
      sources = sources.filter((ds) => ds.public);
    } else if (activeTab === "user") {
      // Include only user data sources
      sources = sources.filter((ds) => !ds.public);
    }

    return sources;
  }, [activeTab, dataSources, searchQuery]);

  if (!boundariesPanelOpen) return null;

  const columnOneIsNumber =
    dataSource?.columnDefs.find((c) => c.name === viewConfig.areaDataColumn)
      ?.type === ColumnType.Number;

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

        {viewConfig.areaDataSourceId && dataSource ? (
          // Show selected data source as a card
          <div>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
              }}
              className="group-hover:bg-neutral-100 transition-colors cursor-pointer rounded-lg"
            >
              <DataSourceItem
                className="shadow-xs"
                dataSource={{
                  ...dataSource,
                }}
              />
            </button>
            <div className="flex justify-between gap-2 mt-1">
              <Button
                variant="ghost"
                className="text-xs font-normal text-muted-foreground hover:text-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <span>Change data source</span>
                <RotateCwIcon className="w-2 h-2" />
              </Button>
              <Button
                variant="ghost"
                className="text-xs font-normal text-muted-foreground hover:text-destructive"
                onClick={() => {
                  updateViewConfig({
                    areaDataSourceId: "",
                    areaDataColumn: "",
                    calculationType: undefined,
                  });
                }}
              >
                <span>Remove</span>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          // Show button to open modal when no data source selected

          <Button
            variant="outline"
            className="w-full justify-between h-10"
            onClick={() => setIsModalOpen(true)}
          >
            <span>Select a data source</span>
            <PlusIcon className="w-4 h-4 ml-2 flex-shrink-0" />
          </Button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <p className="flex gap-2 items-center text-sm font-medium">
          <PieChart className="w-4 h-4 text-muted-foreground" />
          Visualisation
        </p>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 items-center">
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
              className="w-full min-w-0"
              id="choropleth-boundary-select"
            >
              <SelectValue placeholder="Choose boundaries..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_UUID}>No locality</SelectItem>
              {getValidAreaSetGroupCodes(dataSource?.geocodingConfig).map(
                (code) => (
                  <SelectItem key={code} value={code}>
                    {AreaSetGroupCodeLabels[code as AreaSetGroupCode]}
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
                    : CalculationType.Avg,
              })
            }
          >
            <SelectTrigger
              className="w-full min-w-0"
              id="choropleth-calculation-select"
            >
              <SelectValue placeholder="Choose calculation..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="counts">Count by area</SelectItem>
              <SelectItem value="values">Data values</SelectItem>
            </SelectContent>
          </Select>

          {viewConfig.calculationType !== CalculationType.Count &&
            viewConfig.areaDataSourceId && (
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

          {viewConfig.calculationType !== CalculationType.Count &&
            viewConfig.areaDataSourceId &&
            viewConfig.areaDataColumn &&
            columnOneIsNumber &&
            viewConfig.areaDataSecondaryColumn !== undefined &&
            viewConfig.areaDataSecondaryColumn !== "" && (
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
                          (col) => col.type === ColumnType.Number,
                        )
                        .map((col) => ({
                          value: col.name,
                          label: `${col.name} (${col.type})`,
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
              </>
            )}

          {viewConfig.calculationType !== CalculationType.Count &&
            columnOneIsNumber &&
            dataRecordsWillAggregate(
              dataSource?.geocodingConfig,
              viewConfig.areaSetGroupCode,
            ) && (
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
                    className="w-full"
                    id="choropleth-aggregation-select"
                  >
                    <SelectValue placeholder="Choose an aggregation..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CalculationType.Avg}>Average</SelectItem>
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
        {viewConfig.areaDataSourceId &&
          viewConfig.areaDataColumn &&
          !viewConfig.areaSetGroupCode && (
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

      <div className="space-y-2 mb-4">
        {/* Color Scheme Selection */}
        <p className="flex gap-2 items-center text-sm font-medium">
          <Palette className="w-4 h-4 text-muted-foreground" />
          Style
        </p>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 items-center">
          {!viewConfig.areaDataSecondaryColumn && columnOneIsNumber && (
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
                <SelectTrigger className="w-full" id="color-scale-type-select">
                  <SelectValue placeholder="Choose color scale...">
                    {viewConfig.colorScaleType === ColorScaleType.Gradient
                      ? "Gradient"
                      : viewConfig.colorScaleType === ColorScaleType.Stepped
                        ? "Stepped"
                        : "Gradient"}
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
                </SelectContent>
              </Select>

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
                  className="w-full"
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
                          <div className={`w-4 h-4 rounded ${option.color}`} />
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
                        backgroundColor: viewConfig.customColor || "#f73b8c",
                      }}
                    >
                      <input
                        type="color"
                        id="custom-color-picker"
                        value={viewConfig.customColor || "#f73b8c"}
                        onChange={(e) =>
                          updateViewConfig({ customColor: e.target.value })
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Choose color for max value"
                      />
                    </div>
                    <Input
                      type="text"
                      value={viewConfig.customColor || "#f73b8c"}
                      onChange={(e) =>
                        updateViewConfig({ customColor: e.target.value })
                      }
                      className="flex-1"
                      placeholder="#3b82f6"
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
          {!viewConfig.areaDataSecondaryColumn && !columnOneIsNumber && (
            <>
              <Label className="text-sm text-muted-foreground font-normal">
                Category colors
              </Label>
              <div>
                <CategoryColorEditor />
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

        {/* Bivariate visualization button at the bottom */}
        {viewConfig.calculationType !== CalculationType.Count &&
          viewConfig.areaDataSourceId &&
          viewConfig.areaDataColumn &&
          columnOneIsNumber &&
          !viewConfig.areaDataSecondaryColumn && (
            <div className="col-span-2 mt-6">
              <div
                role="button"
                tabIndex={0}
                className="w-full border border-neutral-200 rounded-md bg-white hover:bg-neutral-50 cursor-pointer transition-colors p-2"
                onClick={() => {
                  // Find the first available numeric column
                  const dataSource = dataSources?.find(
                    (ds) => ds.id === viewConfig.areaDataSourceId,
                  );
                  const firstNumericColumn = dataSource?.columnDefs
                    .filter((col) => col.type === ColumnType.Number)
                    .find((col) => col.name !== viewConfig.areaDataColumn);
                  if (firstNumericColumn) {
                    updateViewConfig({
                      areaDataSecondaryColumn: firstNumericColumn.name,
                    });
                  } else {
                    updateViewConfig({
                      areaDataSecondaryColumn: NULL_UUID,
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    // Find the first available numeric column
                    const dataSource = dataSources?.find(
                      (ds) => ds.id === viewConfig.areaDataSourceId,
                    );
                    const firstNumericColumn = dataSource?.columnDefs
                      .filter((col) => col.type === ColumnType.Number)
                      .find((col) => col.name !== viewConfig.areaDataColumn);
                    if (firstNumericColumn) {
                      updateViewConfig({
                        areaDataSecondaryColumn: firstNumericColumn.name,
                      });
                    } else {
                      updateViewConfig({
                        areaDataSecondaryColumn: NULL_UUID,
                      });
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex flex-col items-start gap-1 min-w-0">
                    <span className="text-sm font-medium break-words">
                      Create bivariate visualization
                    </span>
                    <span className="text-xs break-words">
                      Using a second column
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-[10px] text-muted-foreground">
                      Column 1
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="grid grid-cols-3 gap-0.5 border border-neutral-300 rounded p-1.5 bg-white shadow-sm">
                        {[
                          ["#e8e8e8", "#ace4e4", "#5ac8c8"],
                          ["#dfb0d6", "#a5add3", "#5698b9"],
                          ["#be64ac", "#8c62aa", "#3b4994"],
                        ]
                          .reverse()
                          .map((row, i) =>
                            row.map((color, j) => (
                              <div
                                key={`${i}-${j}`}
                                className="w-4 h-4 rounded-sm border border-neutral-200"
                                style={{ backgroundColor: color }}
                              />
                            )),
                          )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Column 2 →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Modal for data source selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Select data source for visualisation</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col">
            {/* Search and Filter Bar */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search data sources..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "all" | "public" | "user")
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="public">Public library</SelectItem>
                  <SelectItem value="user">My data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Source Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-3">
                {filteredAndSearchedDataSources.map((ds) => (
                  <button
                    type="button"
                    className="text-left"
                    key={ds.id}
                    onClick={() => {
                      const selectedAreaSetGroup = viewConfig.areaSetGroupCode;
                      if (!selectedAreaSetGroup) {
                        updateViewConfig({
                          areaDataSourceId: ds.id,
                          areaDataSecondaryColumn: undefined,
                        });
                        setIsModalOpen(false);
                        return;
                      }
                      const dataSource = getDataSourceById(ds.id);
                      const validAreaSetGroups = getValidAreaSetGroupCodes(
                        dataSource?.geocodingConfig,
                      );
                      if (validAreaSetGroups.includes(selectedAreaSetGroup)) {
                        updateViewConfig({
                          areaDataSourceId: ds.id,
                          areaDataSecondaryColumn: undefined,
                        });
                        setIsModalOpen(false);
                        return;
                      }
                      setInvalidDataSourceId(ds.id);
                      setIsModalOpen(false);
                    }}
                  >
                    <DataSourceItem
                      className={
                        viewConfig.areaDataSourceId === ds.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:border-blue-300"
                      }
                      dataSource={{
                        ...ds,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
