import {
  ChevronDown,
  ChevronRight,
  Eye,
  Grid3X3,
  Hexagon,
  Palette,
  Settings,
} from "lucide-react";
import { useContext, useState } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import {
  useChoroplethDataSource,
  useDataSources,
  useMembersDataSource,
} from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { MAX_COLUMN_KEY } from "@/constants";
import { AreaSetGroupCodeLabels } from "@/labels";
import { CalculationType, VisualisationType } from "@/server/models/MapView";
import { getValidAreaSetGroupCodes } from "../../../sources";
import Legend from "../../Legend";
import { defaultLayerStyles } from "../LayerStyles";
import type { DropdownMenuItemType } from "@/components/MultiDropdownMenu";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";

export default function BoundariesControl() {
  const { setBoundariesPanelOpen } = useContext(ChoroplethContext);
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
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

  const getFillLabel = () => {
    if (
      !viewConfig.areaDataSourceId ||
      viewConfig.areaDataSourceId === "" ||
      viewConfig.visualisationType === VisualisationType.BoundaryOnly
    ) {
      return "No Fill";
    }

    if (viewConfig.visualisationType === VisualisationType.Choropleth) {
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
    }

    return "No Fill";
  };

  const getShapeDropdownItems = () => {
    const validAreaSetGroupCodes = getValidAreaSetGroupCodes(
      dataSource?.geocodingConfig,
    );

    const items = [
      {
        type: "item" as const,
        label: "No Locality",
        onClick: () => {
          updateViewConfig({ areaSetGroupCode: null });
        },
      },
      ...validAreaSetGroupCodes.map((code) => ({
        type: "item" as const,
        label: AreaSetGroupCodeLabels[code],
        onClick: () => {
          updateViewConfig({ areaSetGroupCode: code });
        },
      })),
    ];

    return items;
  };

  const getFillDropdownItems = (): DropdownMenuItemType[] => {
    const items: DropdownMenuItemType[] = [
      {
        type: "item" as const,
        label: "No Fill",
        onClick: () => {
          updateViewConfig({
            visualisationType: VisualisationType.BoundaryOnly,
            areaDataSourceId: "",
            areaDataColumn: "",
            calculationType: undefined,
          });
        },
      },
    ];

    // Add Member Count preset if members data source exists
    if (membersDataSource) {
      items.push({
        type: "item" as const,
        label: "Member Count",
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

    // Add Vote Share option with submenu
    const hnhVoteShareDataSource = allDataSources?.find(
      (ds) => ds.name === "HNH Voteshare",
    );

    if (hnhVoteShareDataSource) {
      const columnItems = hnhVoteShareDataSource.columnDefs.map((column) => ({
        type: "item" as const,
        label: column.name,
        onClick: () => {
          updateViewConfig({
            visualisationType: VisualisationType.Choropleth,
            areaDataSourceId: hnhVoteShareDataSource.id,
            areaDataColumn: column.name,
            calculationType: CalculationType.Value,
          });
        },
      }));

      items.push({
        type: "submenu" as const,
        label: "Vote Share",
        items: columnItems,
      });
    }

    return items;
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
        <div className="flex items-center gap-1">
          <IconButtonWithTooltip
            align="start"
            side="right"
            tooltip="Advanced settings"
            onClick={() => setBoundariesPanelOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </IconButtonWithTooltip>
        </div>
      </div>

      {/* Layer Items */}
      {expanded && (
        <div className="space-y-1">
          {/* SHAPE Section */}
          <div className="flex items-center gap-2 bg-white rounded cursor-pointer group relative p-2">
            <Hexagon className="w-4 h-4 text-neutral-600" />
            <div className="flex-1">
              <div className="text-sm font-medium">SHAPE</div>
              <div className="text-xs text-neutral-500">
                {viewConfig.areaSetGroupCode
                  ? AreaSetGroupCodeLabels[
                      viewConfig.areaSetGroupCode as AreaSetGroupCode
                    ]
                  : "No Locality"}
              </div>
            </div>
            <IconButtonWithTooltip
              align="start"
              side="right"
              tooltip="Shape options"
              dropdownLabel="Shape options"
              dropdownItems={getShapeDropdownItems()}
            >
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </IconButtonWithTooltip>
          </div>

          {/* FILL Section */}
          <div className="flex items-center gap-2 bg-white rounded cursor-pointer group relative p-2">
            <Palette className="w-4 h-4 text-neutral-600" />
            <div className="flex-1">
              <div className="text-sm font-medium">FILL</div>
              <div className="text-xs text-neutral-500">{getFillLabel()}</div>
            </div>
            <IconButtonWithTooltip
              align="start"
              side="right"
              tooltip="Fill options"
              dropdownLabel="Fill options"
              dropdownItems={getFillDropdownItems()}
            >
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </IconButtonWithTooltip>
          </div>

          {/* Color gradient bar - show legend when there's visualization data, greyed out when hidden */}
          {viewConfig.areaDataSourceId &&
            viewConfig.areaDataSourceId !== "" && (
              <div className="px-2 py-1">
                <div
                  className={`flex items-center bg-white rounded cursor-pointer group relative ${viewConfig.visualisationType === VisualisationType.BoundaryOnly ? "opacity-50" : ""}`}
                  onClick={toggleChoropleth}
                >
                  <button className="bg-neutral-100 hover:bg-neutral-200 rounded px-0.5 py-2 flex items-center justify-center self-stretch w-8 mr-1">
                    <Eye
                      className={`w-4 h-4 ${viewConfig.visualisationType !== VisualisationType.BoundaryOnly ? "text-neutral-500" : "text-neutral-400"}`}
                    />
                  </button>
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <Legend />
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
