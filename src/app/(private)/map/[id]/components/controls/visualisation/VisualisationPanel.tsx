import {
  ArrowUpDown,
  Calculator,
  CircleAlert,
  Database,
  Info,
  Palette,
  Pentagon,
  PlusIcon,
  X,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import {
  CalculationType,
  ColorScheme,
  VisualisationType,
} from "@/__generated__/types";
import { DataSourceItem } from "@/components/DataSourceItem";
import { ChoroplethContext } from "@/components/Map/context/ChoroplethContext";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { getValidAreaSetGroupCodes } from "@/components/Map/sources";
import { MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import { AreaSetGroupCodeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
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
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import VisualisationShapeLibrarySelector from "./VisualisationShapeLibrarySelector";
import type { AreaSetGroupCode } from "@/__generated__/types";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSource = RouterOutputs["dataSource"]["byOrganisation"][number];

export default function VisualisationPanel({
  positionLeft,
}: {
  positionLeft: number;
}) {
  const { viewConfig, updateViewConfig } = useContext(MapContext);
  const { boundariesPanelOpen, setBoundariesPanelOpen } =
    useContext(ChoroplethContext);
  const { getDataSources, getChoroplethDataSource } =
    useContext(DataSourcesContext);

  // Add this state
  const [activeTab, setActiveTab] = useState<"all" | "public" | "user">("all");
  // Add these states
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dataSources = getDataSources();
  const dataSource = getChoroplethDataSource();

  // Update the filtering logic to include search
  const filteredAndSearchedDataSources = useMemo(() => {
    let sources = dataSources;

    if (searchQuery) {
      sources = sources.filter(
        (ds) =>
          ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ds.columnDefs.some((col) =>
            col.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    return sources;
  }, [dataSources, searchQuery]);

  if (!boundariesPanelOpen) return null;

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
      {/* Choose Visualization Type */}
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-6 / text-sm">
          <h3 className="mt-2 font-medium">Create visualization</h3>
          <button
            aria-label="Close visualization panel"
            className="text-muted-foreground hover:text-primary cursor-pointer"
            onClick={() => setBoundariesPanelOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              viewConfig.visualisationType === VisualisationType.BoundaryOnly
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() =>
              updateViewConfig({
                visualisationType:
                  viewConfig.visualisationType ===
                  VisualisationType.BoundaryOnly
                    ? undefined
                    : VisualisationType.BoundaryOnly,
              })
            }
          >
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded"></div>
            <span className="text-xs">Boundary outline</span>
          </button>

          <button
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              viewConfig.visualisationType === VisualisationType.Choropleth
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() =>
              updateViewConfig({
                visualisationType:
                  viewConfig.visualisationType === VisualisationType.Choropleth
                    ? undefined
                    : VisualisationType.Choropleth,
              })
            }
          >
            <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-red-400 to-blue-400 rounded"></div>
            <span className="text-xs">Filled map</span>
          </button>
        </div>
      </div>

      {viewConfig.visualisationType === VisualisationType.BoundaryOnly && (
        <VisualisationShapeLibrarySelector />
      )}

      {/* Choropleth */}
      {viewConfig.visualisationType === VisualisationType.Choropleth && (
        <>
          <Separator />
          {/* Data Source Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">
              <Database className="w-4 h-4 text-muted-foreground" /> Data source
            </Label>

            {viewConfig.areaDataSourceId && dataSource ? (
              // Show selected data source as a card
              <div className="space-y-2">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                >
                  <DataSourceItem
                    className="border-blue-500 bg-blue-50 hover:bg-blue-100"
                    dataSource={{
                      ...dataSource,
                    }}
                  />
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateViewConfig({
                      areaDataSourceId: undefined,
                      areaDataColumn: undefined,
                    })
                  }
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Change data source
                </Button>
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              <Pentagon className="w-4 h-4 text-muted-foreground" />
              Select map locality shapes
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose boundaries..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NULL_UUID}>No Locality</SelectItem>
                {getValidAreaSetGroupCodes(
                  (dataSource as DataSource)?.geocodingConfig,
                ).map((code) => (
                  <SelectItem key={code} value={code}>
                    {AreaSetGroupCodeLabels[code as AreaSetGroupCode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {viewConfig.visualisationType === VisualisationType.Choropleth &&
              !viewConfig.areaDataSourceId && (
                <div className="flex items-center gap-2">
                  <CircleAlert className="w-4 h-4 text-yellow-500" />
                  <p className="text-xs text-gray-500">
                    No data source selected. Please select a data source to
                    create a choropleth.
                  </p>
                </div>
              )}
            {viewConfig.visualisationType === VisualisationType.Choropleth &&
              viewConfig.areaDataSourceId &&
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
          </div>

          {/* Calculation Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Calculation</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  viewConfig.calculationType === CalculationType.Value ||
                  !viewConfig.calculationType
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() =>
                  updateViewConfig({ calculationType: CalculationType.Value })
                }
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-gray-300 rounded"></div>
                <span className="text-xs">Use existing values</span>
              </button>

              <button
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  viewConfig.calculationType === CalculationType.Count
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() =>
                  updateViewConfig({ calculationType: CalculationType.Count })
                }
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                  #
                </div>
                <span className="text-xs">Count records</span>
              </button>
            </div>

            {/* Column Selection for "Use existing values" */}
            {(viewConfig.calculationType === CalculationType.Value ||
              !viewConfig.calculationType) &&
              viewConfig.areaDataSourceId && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Select column to use for values
                  </Label>
                  <Select
                    value={viewConfig.areaDataColumn || ""}
                    onValueChange={(value) =>
                      updateViewConfig({ areaDataColumn: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key={MAX_COLUMN_KEY} value={MAX_COLUMN_KEY}>
                        Highest-value column (String)
                      </SelectItem>
                      {dataSources
                        .find((ds) => ds.id === viewConfig.areaDataSourceId)
                        ?.columnDefs.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name} ({col.type})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            {/* Geographic Column Reference for "Count records" */}
            {viewConfig.calculationType === CalculationType.Count &&
              viewConfig.areaDataSourceId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Count records
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    This will count the number of records in each geographic
                    area based on the boundary shapes you{"'"}ve selected.
                  </p>
                </div>
              )}
          </div>

          {/* Boundary Matching - only show for count calculations or when column is selected */}
          {(viewConfig.calculationType === CalculationType.Count ||
            viewConfig.areaDataColumn) &&
            viewConfig.areaSetGroupCode && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Label className="text-xs text-muted-foreground font-normal">
                    Your data boundary will be matched with the map boundaries
                    that you&apos;ve selected
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm space-y-2">
                        <p className="text-sm font-medium">Smart Matching</p>
                        <p className="text-xs">
                          We automatically match your data to map boundaries
                          based on what you select.
                        </p>

                        <div className="space-y-2">
                          <div className="text-xs">
                            <span className="font-medium">Example:</span> Your
                            data has postcode &quot;SW1 1AA&quot;
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                              <span>
                                <strong>Postcodes:</strong> Matches
                                &quot;SW1&quot;
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              <span>
                                <strong>Constituencies:</strong> Matches
                                &quot;Westminster&quot;
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                              <span>
                                <strong>MSOAs:</strong> Matches
                                &quot;E05000001&quot;
                              </span>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Contextual Information Based on Selected Boundary */}
                {viewConfig.areaSetGroupCode && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Pentagon className="w-4 h-4 text-blue-500 pt-1" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">
                          Using{" "}
                          {AreaSetGroupCodeLabels[viewConfig.areaSetGroupCode]}{" "}
                          shapes
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Exclude Columns Input - only show when MAX_COLUMN_KEY is selected */}
          {viewConfig.areaDataColumn === MAX_COLUMN_KEY && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Exclude columns</Label>
              <input
                type="text"
                onChange={(e) =>
                  updateViewConfig({
                    excludeColumnsString: e.target.value,
                  })
                }
                placeholder="Comma-separated columns to exclude"
                value={viewConfig.excludeColumnsString}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Color Scheme Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-neutral-600">Color scheme</Label>
            </div>

            <Select
              value={viewConfig.colorScheme || ColorScheme.RedBlue}
              onValueChange={(value) =>
                updateViewConfig({
                  colorScheme: value as ColorScheme,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose color scheme..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ColorScheme.RedBlue}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-blue-400 rounded"></div>
                    Red to blue
                  </div>
                </SelectItem>
                <SelectItem value={ColorScheme.GreenYellowRed}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded"></div>
                    Green to red
                  </div>
                </SelectItem>
                <SelectItem value={ColorScheme.Viridis}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 rounded"></div>
                    Viridis
                  </div>
                </SelectItem>
                <SelectItem value={ColorScheme.Plasma}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded"></div>
                    Plasma
                  </div>
                </SelectItem>
                <SelectItem value={ColorScheme.Diverging}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-400 via-white to-red-400 rounded"></div>
                    Diverging
                  </div>
                </SelectItem>
                <SelectItem value={ColorScheme.Sequential}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-200 to-blue-600 rounded"></div>
                    Sequential
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 py-2">
              <Switch
                id="color-scheme-switch"
                checked={Boolean(viewConfig.reverseColorScheme)}
                onCheckedChange={(v) =>
                  updateViewConfig({ reverseColorScheme: v })
                }
              />
              <label htmlFor="color-scheme-switch" className="text-sm">
                Reversed color scheme
              </label>
            </div>
          </div>
        </>
      )}

      {/* Modal for data source selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Select data source for visualization</DialogTitle>
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
                      updateViewConfig({ areaDataSourceId: ds.id });
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
    </div>
  );
}
