import { CornerDownRight, PaintBucketIcon, Scan, ChevronDown, Check, Calculator, Link, Palette, Info, ArrowUpDown } from "lucide-react";
import { useContext, useState, useMemo } from "react";
import { AreaSetGroupCode } from "@/__generated__/types";
import { ChoroplethContext } from "@/app/(private)/map/[id]/context/ChoroplethContext";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MAX_COLUMN_KEY, NULL_UUID } from "@/constants";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { AREA_SET_GROUP_LABELS } from "../../sources";
import { Button } from "@/shadcn/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Separator } from "@/shadcn/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shadcn/ui/tooltip";

// Add this component above the main ChoroplethControl component:
function DataSourceCard({
  dataSource,
  isSelected,
  onClick
}: {
  dataSource: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Data Source Icon/Preview */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {dataSource.name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{dataSource.name}</h4>
            {dataSource.isPublic && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Public
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600">
            {dataSource.columnDefs.length} columns • {dataSource.recordCount || 'Unknown'} records
          </p>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChoroplethControl() {
  const { viewConfig, updateViewConfig } = useContext(MapContext);
  const { boundariesPanelOpen } = useContext(ChoroplethContext);
  const { getDataSources, getChoroplethDataSource } =
    useContext(DataSourcesContext);

  // Add this state
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'user'>('all');
  // Add these states
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dataSources = getDataSources();
  const dataSource = getChoroplethDataSource();

  // Add this memoized filtering logic
  const filteredDataSources = useMemo(() => {
    let sources = dataSources;

    if (activeTab === 'public') {
      sources = sources.filter(ds => ds.isPublic);
    } else if (activeTab === 'user') {
      sources = sources.filter(ds => !ds.isPublic);
    }

    // // Only show data sources that have geographic data or can be mapped
    // return sources.filter(ds =>
    //   ds.columnDefs.some(col =>
    //     col.type === 'geographic' ||
    //     col.name.toLowerCase().includes('postcode') ||
    //     col.name.toLowerCase().includes('constituency')
    //   )
    // );

    return sources;
  }, [dataSources, activeTab]);

  // Update the filtering logic to include search
  const filteredAndSearchedDataSources = useMemo(() => {
    let sources = filteredDataSources;

    if (searchQuery) {
      sources = sources.filter(ds =>
        ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.columnDefs.some(col =>
          col.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    return sources;
  }, [filteredDataSources, searchQuery]);

  if (!boundariesPanelOpen) return null;

  const handlePreview = () => {
    console.log("Preview clicked");
    // Implement preview logic here
  };

  const handleApply = () => {
    console.log("Apply clicked");
    // Implement apply logic here
  };

  return (
    <div className="flex flex-col gap-4 p-3 bg-neutral-50 w-80 overflow-y-auto">
      {/* Step 1: Choose Visualization Type */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Create Visualization</h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-3 rounded-lg border-2 text-center transition-all ${viewConfig.visualizationType === 'boundary-only'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
            onClick={() => updateViewConfig({ visualizationType: 'boundary-only' })}
          >
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded"></div>
            <span className="text-xs">Boundary Outline</span>
          </button>

          <button
            className={`p-3 rounded-lg border-2 text-center transition-all ${viewConfig.visualizationType === 'choropleth'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
            onClick={() => updateViewConfig({ visualizationType: 'choropleth' })}
          >
            <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-red-400 to-blue-400 rounded"></div>
            <span className="text-xs">Filled Map</span>
          </button>
        </div>
      </div>

      {/* Step 2: Select Boundary Set */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Map Boundaries</Label>
        <Select
          value={viewConfig.areaSetGroupCode || NULL_UUID}
          onValueChange={(value) => updateViewConfig({ areaSetGroupCode: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose boundaries..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NULL_UUID}>No boundaries</SelectItem>
            {Object.entries(AREA_SET_GROUP_LABELS).map(([code, label]) => (
              <SelectItem key={code} value={code}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 3: Data Source (only for choropleth) */}
      {viewConfig.visualizationType === 'choropleth' && viewConfig.areaDataSourceId && (
        <>
          <Separator />
          {/* Data Source Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">Data Source</Label>

            {viewConfig.areaDataSourceId ? (
              // Show selected data source as a card
              <div className="space-y-2">
                <DataSourceCard
                  dataSource={dataSources.find(ds => ds.id === viewConfig.areaDataSourceId)}
                  isSelected={true}
                  onClick={() => {
                    // Open modal to change selection
                    setIsModalOpen(true);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateViewConfig({ areaDataSourceId: null })}
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
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            )}
          </div>

          {/* Column Selection - only show when data source is selected */}
          {viewConfig.areaDataSourceId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CornerDownRight className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm text-neutral-600">
                  {viewConfig.calculationType === 'count' ? 'Data Boundary Field' : 'Data Column'}
                </Label>
              </div>

              <Select
                value={viewConfig.areaDataColumn}
                onValueChange={(value) =>
                  updateViewConfig({ areaDataColumn: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    viewConfig.calculationType === 'count'
                      ? 'Select boundary identifier column'
                      : 'Select a column'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {viewConfig.calculationType === 'count' ? (
                    // For counting, show columns that could be boundary identifiers
                    <>
                      <SelectItem value={MAX_COLUMN_KEY}>
                        Auto-detect boundary column
                      </SelectItem>
                      {dataSource?.columnDefs
                        .filter(col =>
                          col.name.toLowerCase().includes('postcode') ||
                          col.name.toLowerCase().includes('constituency') ||
                          col.name.toLowerCase().includes('area') ||
                          col.name.toLowerCase().includes('ward') ||
                          col.name.toLowerCase().includes('district')
                        )
                        .map((cd: { name: string }) => (
                          <SelectItem key={cd.name} value={cd.name}>
                            {cd.name}
                          </SelectItem>
                        ))
                      }
                    </>
                  ) : (
                    // For existing values, show all columns
                    <>
                      <SelectItem value={MAX_COLUMN_KEY}>
                        Highest-value column
                      </SelectItem>
                      {dataSource?.columnDefs.map((cd: { name: string }) => (
                        <SelectItem key={cd.name} value={cd.name}>
                          {cd.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Boundary Matching - only show for count calculations */}
          {viewConfig.areaDataColumn && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
                <Label className="text-xs text-muted-foreground font-normal">Your Data Boundary will be matched with the map boundaries that you've selected</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm space-y-2">
                      <p className="text-sm font-medium">Smart Matching</p>
                      <p className="text-xs">
                        We automatically match your data to map boundaries based on what you select.
                      </p>

                      <div className="space-y-2">
                        <div className="text-xs">
                          <span className="font-medium">Example:</span> Your data has postcode "SW1 1AA"
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <span><strong>Postcodes:</strong> Matches "SW1"</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span><strong>Constituencies:</strong> Matches "Westminster"</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            <span><strong>MSOAs:</strong> Matches "E05000001"</span>
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">
                        Using {viewConfig.areaSetGroupCode === 'constituencies' ? 'Constituencies' :
                          viewConfig.areaSetGroupCode === 'msoas' ? 'MSOAs' :
                            viewConfig.areaSetGroupCode === 'postcodes' ? 'Postcode Areas' :
                              viewConfig.areaSetGroupCode} boundaries
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        {viewConfig.areaSetGroupCode === 'constituencies' &&
                          'Match your data to constituency names or postcodes'}
                        {viewConfig.areaSetGroupCode === 'msoas' &&
                          'Match your data to MSOA codes or names'}
                        {viewConfig.areaSetGroupCode === 'postcodes' &&
                          'Match your data to postcode areas (first 3-4 characters)'}
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
              <Label className="text-sm font-medium">Exclude Columns</Label>
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

          {/* Calculation Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Calculation</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                className={`p-3 rounded-lg border-2 text-center transition-all ${viewConfig.calculationType === 'value'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => updateViewConfig({ calculationType: 'value' })}
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-gray-300 rounded"></div>
                <span className="text-xs">Use existing values</span>
              </button>

              <button
                className={`p-3 rounded-lg border-2 text-center transition-all ${viewConfig.calculationType === 'count'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => updateViewConfig({ calculationType: 'count' })}
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                  #
                </div>
                <span className="text-xs">Count records</span>
              </button>

              <button
                className={`p-3 rounded-lg border-2 text-center transition-all ${viewConfig.calculationType === 'sum'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => updateViewConfig({ calculationType: 'sum' })}
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-green-400 rounded flex items-center justify-center text-white text-xs font-bold">
                  Σ
                </div>
                <span className="text-xs">Sum values</span>
              </button>

              <button
                className={`p-3 rounded-lg border-2 text-center transition-all ${viewConfig.calculationType === 'average'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => updateViewConfig({ calculationType: 'average' })}
              >
                <div className="w-6 h-6 mx-auto mb-2 bg-purple-400 rounded flex items-center justify-center text-white text-xs font-bold">
                  x̄
                </div>
                <span className="text-xs">Average values</span>
              </button>
            </div>
          </div>

          {/* Color Scheme Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-neutral-600">Color Scheme</Label>
            </div>

            <Select
              value={viewConfig.colorScheme || 'red-blue'}
              onValueChange={(value) => updateViewConfig({ colorScheme: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose color scheme..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="red-blue">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-blue-400 rounded"></div>
                    Red to Blue
                  </div>
                </SelectItem>
                <SelectItem value="green-yellow-red">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded"></div>
                    Green to Red
                  </div>
                </SelectItem>
                <SelectItem value="viridis">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 rounded"></div>
                    Viridis
                  </div>
                </SelectItem>
                <SelectItem value="plasma">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded"></div>
                    Plasma
                  </div>
                </SelectItem>
                <SelectItem value="diverging">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-400 via-white to-red-400 rounded"></div>
                    Diverging
                  </div>
                </SelectItem>
                <SelectItem value="sequential">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-200 to-blue-600 rounded"></div>
                    Sequential
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Modal for data source selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Data Source for Visualization</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Search and Filter Bar */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search data sources..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="public">Public Library</SelectItem>
                  <SelectItem value="user">My Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Source Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                {filteredAndSearchedDataSources.map((ds) => (
                  <DataSourceCard
                    key={ds.id}
                    dataSource={ds}
                    isSelected={viewConfig.areaDataSourceId === ds.id}
                    onClick={() => {
                      updateViewConfig({ areaDataSourceId: ds.id });
                      setIsModalOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
