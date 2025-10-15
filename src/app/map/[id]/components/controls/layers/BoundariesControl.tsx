import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  Grid3X3,
  Hexagon,
  MapPin,
  Palette,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY } from "@/constants";
import { AreaSetGroupCodeLabels } from "@/labels";
import {
  CalculationType,
  ColorScheme,
  VisualisationType,
} from "@/server/models/MapView";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";
import Legend from "../../Legend";
import { defaultLayerStyles } from "../LayerStyles";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";

export default function BoundariesControl() {
  // const { setBoundariesPanelOpen } = useContext(ChoroplethContext); // Unused variable
  const { viewConfig, updateViewConfig } = useMapViews();
  // const dataSource = useChoroplethDataSource(); // Unused variable
  const membersDataSource = useMembersDataSource();
  const { data: allDataSources } = useDataSources();
  const [expanded, setExpanded] = useState(true);

  const toggleChoropleth = () => {
    if (viewConfig.visualisationType === VisualisationType.BoundaryOnly) {
      // Show choropleth visualization
      updateViewConfig({ visualisationType: VisualisationType.Choropleth });
    } else {
      // Hide choropleth visualization
      updateViewConfig({ visualisationType: VisualisationType.BoundaryOnly });
    }
  };

  const isChoroplethVisible =
    viewConfig.visualisationType !== VisualisationType.BoundaryOnly;

  const getFillLabel = () => {
    if (!viewConfig.areaDataSourceId || viewConfig.areaDataSourceId === "") {
      return "No Fill";
    }

    if (viewConfig.calculationType === CalculationType.Count) {
      return "Member Count";
    }

    // Check if it's a specific vote share column
    const hnhVoteShareDataSource = allDataSources?.find(
      (ds) => ds.name === "HNH Voteshare",
    );

    if (
      hnhVoteShareDataSource &&
      viewConfig.areaDataSourceId === hnhVoteShareDataSource.id &&
      viewConfig.areaDataColumn
    ) {
      return viewConfig.areaDataColumn;
    }

    return "Data Visualization";
  };

  const getFillIcon = () => {
    if (!viewConfig.areaDataSourceId || viewConfig.areaDataSourceId === "") {
      return <Circle className="w-4 h-4" />;
    }

    if (viewConfig.calculationType === CalculationType.Count) {
      return <Users className="w-4 h-4" />;
    }
    return <BarChart3 className="w-4 h-4" />;
  };

  const getShapeOptions = () => {
    // Get all available area set group codes from labels, not dependent on data source
    const allAreaSetGroupCodes = Object.keys(
      AreaSetGroupCodeLabels,
    ) as AreaSetGroupCode[];

    return [
      {
        label: "No Locality",
        icon: <Circle className="w-4 h-4" />,
        onClick: () => {
          updateViewConfig({ areaSetGroupCode: null });
        },
      },
      ...allAreaSetGroupCodes.map((code) => ({
        label: AreaSetGroupCodeLabels[code],
        icon: <MapPin className="w-4 h-4" />,
        onClick: () => {
          updateViewConfig({ areaSetGroupCode: code });
        },
      })),
    ];
  };

  const getFillOptions = () => {
    // const hnhVoteShareDataSource = allDataSources?.find(
    //   (ds) => ds.name === "HNH Voteshare",
    // ); // Unused variable

    const options = [
      {
        label: "No Fill",
        icon: <Circle className="w-4 h-4" />,
        onClick: () => {
          updateViewConfig({
            areaDataSourceId: "",
            areaDataColumn: "",
            calculationType: undefined,
          });
        },
      },
    ];

    // Add Member Count preset if members data source exists
    if (membersDataSource) {
      options.push({
        label: "Member Count",
        icon: <Users className="w-4 h-4" />,
        onClick: () => {
          updateViewConfig({
            visualisationType: VisualisationType.Choropleth,
            areaDataSourceId: membersDataSource.id,
            areaDataColumn: MAX_COLUMN_KEY,
            calculationType: CalculationType.Count,
          });
        },
      });
    }

    return options;
  };

  const getVoteShareOptions = () => {
    const hnhVoteShareDataSource = allDataSources?.find(
      (ds) => ds.name === "HNH Voteshare",
    );

    if (!hnhVoteShareDataSource) return [];

    return hnhVoteShareDataSource.columnDefs.map((column) => ({
      label: column.name,
      icon: <BarChart3 className="w-4 h-4" />,
      onClick: () => {
        updateViewConfig({
          visualisationType: VisualisationType.Choropleth,
          areaDataSourceId: hnhVoteShareDataSource.id,
          areaDataColumn: column.name,
          calculationType: CalculationType.Value,
        });
      },
    }));
  };

  const getColorSchemeOptions = () => {
    return [
      {
        label: "Sequential",
        value: ColorScheme.Sequential,
        color: "bg-gradient-to-r from-blue-100 to-blue-600",
      },
      {
        label: "Red-Blue",
        value: ColorScheme.RedBlue,
        color: "bg-gradient-to-r from-red-500 to-blue-500",
      },
      {
        label: "Green-Yellow-Red",
        value: ColorScheme.GreenYellowRed,
        color: "bg-gradient-to-r from-green-500 via-yellow-500 to-red-500",
      },
      {
        label: "Viridis",
        value: ColorScheme.Viridis,
        color: "bg-gradient-to-r from-purple-600 via-blue-500 to-green-500",
      },
      {
        label: "Plasma",
        value: ColorScheme.Plasma,
        color: "bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500",
      },
      {
        label: "Diverging",
        value: ColorScheme.Diverging,
        color: "bg-gradient-to-r from-brown-500 via-yellow-500 to-teal-500",
      },
    ];
  };

  return (
    <div className={defaultLayerStyles.container}>
      {/* Header */}
      <div className={defaultLayerStyles.header}>
        <button
          className="flex items-center gap-2 hover:bg-neutral-100 rounded p-1 -m-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-600" />
          )}
          <Grid3X3 className="w-4 h-4 text-neutral-600" />
          <span className="text-sm font-medium">Boundaries</span>
        </button>
        {/* <div className="flex items-center gap-1">
          <IconButtonWithTooltip
            align="start"
            side="right"
            tooltip="Advanced settings"
            onClick={() => setBoundariesPanelOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </IconButtonWithTooltip>
        </div> */}
      </div>

      {/* Layer Items */}
      {expanded && (
        <div className="space-y-2 p-2">
          {/* SHAPE Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <Hexagon className="w-4 h-4 " />
              <span className="text-sm font-medium uppercase">Shape</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-2 px-2 shadow-none"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MapPin className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {viewConfig.areaSetGroupCode
                          ? AreaSetGroupCodeLabels[
                              viewConfig.areaSetGroupCode as AreaSetGroupCode
                            ]
                          : "No Locality"}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Choose Shape</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {getShapeOptions().map((option, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={option.onClick}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-shrink-0">{option.icon}</div>
                    <span className="truncate">{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />
          {/* FILL Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-neutral-500">
              <Palette className="w-4 h-4 " />
              <span className="text-sm font-medium uppercase ">Fill</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-between h-auto py-2 px-2 shadow-none ${!isChoroplethVisible ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex-shrink-0">{getFillIcon()}</div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {getFillLabel()}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Choose Fill Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {getFillOptions().map((option, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={option.onClick}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-shrink-0">{option.icon}</div>
                    <span className="truncate">{option.label}</span>
                  </DropdownMenuItem>
                ))}
                {getVoteShareOptions().length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="truncate">Vote Share</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {getVoteShareOptions().map((option, index) => (
                          <DropdownMenuItem
                            key={index}
                            onClick={option.onClick}
                            className="flex items-center gap-2"
                          >
                            <div className="flex-shrink-0">{option.icon}</div>
                            <span className="truncate">{option.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Legend Section */}
          {viewConfig.areaDataSourceId &&
            viewConfig.areaDataSourceId !== "" && (
              <div className="space-y-1">
                <div
                  className={`flex items-center bg-white   cursor-pointer group relative ${viewConfig.visualisationType === VisualisationType.BoundaryOnly ? "opacity-50" : ""}`}
                >
                  <button
                    className="bg-neutral-100 hover:bg-neutral-200 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-2"
                    onClick={toggleChoropleth}
                  >
                    <Eye
                      className={`w-4 h-4 ${viewConfig.visualisationType !== VisualisationType.BoundaryOnly ? "text-neutral-500" : "text-neutral-400"}`}
                    />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex-1 min-w-0 flex items-center gap-1  cursor-pointer">
                        <Legend />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Choose Color Scheme</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {getColorSchemeOptions().map((option, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() =>
                            updateViewConfig({ colorScheme: option.value })
                          }
                          className="flex items-center gap-2"
                        >
                          <div className={`w-4 h-4 rounded ${option.color}`} />
                          <span className="truncate">{option.label}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <Switch
                          id="reverse-color-scheme-switch"
                          checked={Boolean(viewConfig.reverseColorScheme)}
                          onCheckedChange={(checked) =>
                            updateViewConfig({ reverseColorScheme: checked })
                          }
                        />
                        <label
                          htmlFor="reverse-color-scheme-switch"
                          className="text-sm cursor-pointer"
                        >
                          Reverse colors
                        </label>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
