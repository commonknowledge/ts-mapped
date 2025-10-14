import { ChevronDown, ChevronRight, Grid3X3, Hexagon, Palette, Settings } from "lucide-react";
import { useContext, useState } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useChoroplethDataSource, useMembersDataSource, useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { AreaSetGroupCodeLabels } from "@/labels";
import { VisualisationType, CalculationType } from "@/server/models/MapView";
import { mapColors } from "../../../styles";
import LayerItem from "../LayerItem";
import { LayerStyles } from "../PrivateMapControls";
import Legend from "../../Legend";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { getValidAreaSetGroupCodes } from "../../../sources";
import type { AreaSetGroupCode } from "@/server/models/AreaSet";

export default function BoundariesControl({ LayerStyles }: { LayerStyles: LayerStyles }) {
    const { boundariesPanelOpen, setBoundariesPanelOpen } = useContext(ChoroplethContext);
    const { viewConfig, updateViewConfig } = useMapViews();
    const dataSource = useChoroplethDataSource();
    const membersDataSource = useMembersDataSource();
    const { data: allDataSources } = useDataSources();
    const [expanded, setExpanded] = useState(true);

    const getShapeDropdownItems = () => {
        const validAreaSetGroupCodes = getValidAreaSetGroupCodes(dataSource?.geocodingConfig);

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
            {
                type: "separator" as const,
            },
            {
                type: "item" as const,
                label: "Advanced Settings",
                onClick: () => setBoundariesPanelOpen(true),
            },
        ];

        return items;
    };

    const getFillDropdownItems = () => {
        const items = [
            {
                type: "item" as const,
                label: "No Fill",
                onClick: () => {
                    updateViewConfig({
                        visualisationType: undefined,
                        areaDataSourceId: undefined,
                        areaDataColumn: undefined,
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
                        areaDataColumn: undefined,
                        calculationType: CalculationType.Count,
                    });
                },
            });
        }

        // Add Vote Share option with submenu
        const hnhVoteShareDataSource = allDataSources?.find(ds => ds.name === "HNH Voteshare");

        if (hnhVoteShareDataSource) {
            const columnItems = hnhVoteShareDataSource.columnDefs.map(column => ({
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

        items.push(
            {
                type: "separator" as const,
            },
            {
                type: "item" as const,
                label: "Advanced Settings",
                onClick: () => setBoundariesPanelOpen(true),
            }
        );

        return items;
    };

    return (
        <div className={LayerStyles.container}>
            {/* Header */}
            <div className={LayerStyles.header}>
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
                                    ? AreaSetGroupCodeLabels[viewConfig.areaSetGroupCode as AreaSetGroupCode]
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
                            <div className="text-xs text-neutral-500">
                                {viewConfig.visualisationType === VisualisationType.Choropleth && viewConfig.areaDataSourceId
                                    ? "Data Visualization"
                                    : "No Fill"}
                            </div>
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

                    {/* Color gradient bar - only show if there's actual visualization data */}
                    {viewConfig.visualisationType === VisualisationType.Choropleth && viewConfig.areaDataSourceId && (
                        <div className="px-2 py-1">
                            <Legend />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
