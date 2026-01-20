import * as turf from "@turf/turf";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import { MapPin, XIcon } from "lucide-react";
import { expression } from "mapbox-gl/dist/style-spec/index.cjs";
import { useMemo } from "react";

import { AreaSetCodeLabels } from "@/labels";
import { ColumnType } from "@/server/models/DataSource";
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import { formatNumber } from "@/utils/text";

import { selectedAreasAtom } from "../atoms/selectedAreasAtom";
import { useFillColor } from "../colors";
import { useAreaStats } from "../data";
import { useChoropleth } from "../hooks/useChoropleth";
import { useChoroplethDataSource } from "../hooks/useDataSources";
import { useInspector } from "../hooks/useInspector";
import { useMapRef } from "../hooks/useMapCore";
import { useHoverArea } from "../hooks/useMapHover";
import { useMapViews } from "../hooks/useMapViews";
import type { AreaSetCode } from "@/server/models/AreaSet";
import type { Feature, MultiPolygon, Polygon } from "geojson";

const getDisplayValue = (
  calculationType: CalculationType | null | undefined,
  areaStats:
    | {
        columnType: ColumnType;
        minValue: number;
        maxValue: number;
      }
    | undefined
    | null,
  areaStatValue: unknown,
): string => {
  if (
    areaStatValue === undefined ||
    areaStatValue === null ||
    areaStatValue === ""
  ) {
    return calculationType === CalculationType.Count ? "0" : "-";
  }
  if (areaStats?.columnType !== ColumnType.Number) {
    return String(areaStatValue);
  }
  const value = Number(areaStatValue);
  if (isNaN(value)) {
    return "-";
  }
  if (areaStats?.minValue >= 0 && areaStats?.maxValue <= 1) {
    return `${Math.round(value * 1000) / 10}%`;
  }
  return formatNumber(value);
};

const toRGBA = (expressionResult: unknown) => {
  if (
    !expressionResult ||
    !Array.isArray(expressionResult) ||
    expressionResult.length < 3
  ) {
    return `rgba(0, 0, 0, 0)`;
  }
  const [r, g, b, ...rest] = expressionResult;
  const a = rest.length ? rest[0] : 1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default function AreaInfo({
  onStopAdding,
  compareModeEnabled = true,
  isSectionVisible = true,
}: {
  onStopAdding?: () => void;
  compareModeEnabled?: boolean;
  isSectionVisible?: boolean;
}) {
  const [hoverArea] = useHoverArea();
  const [selectedAreas, setSelectedAreas] = useAtom(selectedAreasAtom);
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  const choroplethDataSource = useChoroplethDataSource();
  const { viewConfig } = useMapViews();
  const { setSelectedBoundary, selectedBoundary } = useInspector();
  const mapRef = useMapRef();
  const { choroplethLayerConfig } = useChoropleth();

  const fillColor = useFillColor({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isReversed: Boolean(viewConfig.reverseColorScheme),
    selectedBivariateBucket: null,
    categoryColors: viewConfig.categoryColors,
    colorScaleType: viewConfig.colorScaleType,
    steppedColorSteps: viewConfig.steppedColorSteps,
    customColor: viewConfig.customColor,
  });

  // Combine selected areas and hover area, avoiding duplicates
  // Memoized to prevent downstream recalculations (especially color expressions)
  const areasToDisplay = useMemo(() => {
    const areas = [];

    // Add all selected areas
    for (const selectedArea of selectedAreas) {
      areas.push({
        code: selectedArea.code,
        name: selectedArea.name,
        areaSetCode: selectedArea.areaSetCode,
        coordinates: selectedArea.coordinates,
        isSelected: true,
      });
    }

    return areas;
  }, [selectedAreas]);

  const hasSecondaryData = Boolean(viewConfig.areaDataSecondaryColumn);

  const statLabel = areaStats
    ? areaStats.calculationType === CalculationType.Count
      ? `${choroplethDataSource?.name || "Unknown"} count`
      : viewConfig.areaDataColumn
    : "";

  const { result, value: fillColorExpression } = expression.createExpression([
    "to-rgba",
    fillColor,
  ]);

  if (result !== "success") {
    console.error(
      "Attempted to parse invalid MapboxGL expression",
      JSON.stringify(fillColor),
      fillColorExpression,
    );
  }

  // Memoize color calculations for all areas to improve performance
  const areaColors = useMemo(() => {
    const colors = new Map<string, string>();

    if (result !== "success" || !areaStats) {
      return colors;
    }

    for (const area of areasToDisplay) {
      const areaStat =
        areaStats.areaSetCode === area.areaSetCode
          ? areaStats.stats.find((s) => s.areaCode === area.code)
          : null;

      if (!areaStat) {
        colors.set(
          `${area.areaSetCode}-${area.code}`,
          "rgba(200, 200, 200, 1)",
        );
        continue;
      }

      // For bivariate color schemes, evaluate with both primary and secondary values
      const colorResult = fillColorExpression.evaluate(
        { zoom: 0 },
        { type: "Polygon", properties: {} },
        {
          value: areaStat.primary || 0,
          secondaryValue: areaStat.secondary || 0,
        },
      );

      colors.set(`${area.areaSetCode}-${area.code}`, toRGBA(colorResult));
    }

    return colors;
  }, [areasToDisplay, areaStats, fillColorExpression, result]);

  // Helper to get color for an area based on memoized calculations
  const getAreaColor = (area: {
    code: string;
    areaSetCode: string;
  }): string => {
    return (
      areaColors.get(`${area.areaSetCode}-${area.code}`) ||
      "rgba(200, 200, 200, 1)"
    );
  };

  // Early return after all hooks have been called
  if (!areaStats) {
    return null;
  }

  // Get boundary type label from the first area's areaSetCode
  // If no areas, try to get label from hoverArea or use a default
  const boundaryTypeLabel = areasToDisplay.length > 0
    ? AreaSetCodeLabels[areasToDisplay[0].areaSetCode as AreaSetCode] || areasToDisplay[0].areaSetCode
    : hoverArea
      ? AreaSetCodeLabels[hoverArea.areaSetCode as AreaSetCode] || hoverArea.areaSetCode
      : "Area";

  // Show the component when the section is visible (simplified logic)
  const shouldShow = isSectionVisible;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, type: "tween" }}
          className="rounded py-1 relative pointer-events-auto"
        >
          {/* Header with better hierarchy */}
          <div className="flex items-center justify-between gap-2 px-1 py-2 border-b bg-neutral-50">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold">
                  Comparison Areas
                </h2>
                <span className="text-xs text-muted-foreground">
                  {selectedAreas.length} {selectedAreas.length === 1 ? "area" : "areas"} selected
                </span>
              </div>
            </div>
            {selectedAreas.length > 0 && (
              <button
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-neutral-200 rounded transition-colors"
                aria-label="Clear all comparison areas"
                onClick={() => setSelectedAreas([])}
                title="Clear all comparison areas"
              >
                <XIcon size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="pt-2 w-full overflow-hidden">
              <Table
                className="border-none w-full"
                style={{ tableLayout: "fixed", width: "100%", maxWidth: "100%" }}
              >
                {/* Always show headers when section is visible */}
                <TableHeader className="">
                  <TableRow className="border-none hover:bg-transparent uppercase font-mono">
                    <TableHead className="py-2 px-2 text-muted-foreground text-xs text-left h-auto break-words" style={{ width: hasSecondaryData ? "40%" : "60%" }}>
                      {boundaryTypeLabel}
                    </TableHead>
                    <TableHead className="py-2 px-2 text-muted-foreground text-xs text-right h-auto break-words whitespace-normal" style={{ width: hasSecondaryData ? "30%" : "40%", maxWidth: "80px", wordBreak: "break-word", overflowWrap: "break-word" }}>
                      <div className="break-words whitespace-normal">{statLabel}</div>
                    </TableHead>
                    {hasSecondaryData && (
                      <TableHead className="py-2 px-2 text-muted-foreground text-xs text-right h-auto break-words whitespace-normal" style={{ width: "30%", maxWidth: "80px", wordBreak: "break-word", overflowWrap: "break-word" }}>
                        <div className="break-words whitespace-normal">{viewConfig.areaDataSecondaryColumn}</div>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areasToDisplay.map((area) => {
                    const areaStat =
                      areaStats.areaSetCode === area.areaSetCode
                        ? areaStats.stats.find((s) => s.areaCode === area.code)
                        : null;

                    const primaryValue = areaStat
                      ? getDisplayValue(
                          areaStats.calculationType,
                          areaStats.primary,
                          areaStat.primary,
                        )
                      : "-";
                    const secondaryValue = areaStat
                      ? getDisplayValue(
                          areaStats.calculationType,
                          areaStats.secondary,
                          areaStat.secondary,
                        )
                      : "-";

                    const handleMakeSelected = () => {
                      setSelectedBoundary({
                        id: area.code,
                        areaCode: area.code,
                        areaSetCode: area.areaSetCode as AreaSetCode,
                        sourceLayerId: choroplethLayerConfig.mapbox.layerId,
                        name: area.name,
                        properties: null,
                      });
                    };

                    const handleFlyTo = () => {
                      const map = mapRef?.current;
                      if (!map) return;

                      const { sourceId, layerId, featureCodeProperty } = choroplethLayerConfig.mapbox;

                      // Query all features in the source to find the one matching this area code
                      const source = map.getSource(sourceId);
                      if (source && source.type === "vector") {
                        // For vector sources, query by property
                        const features = map.querySourceFeatures(sourceId, {
                          sourceLayer: layerId,
                          filter: ["==", ["get", featureCodeProperty], area.code],
                        });
                        
                        if (features.length > 0) {
                          const feature = features[0];
                          if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                            const bbox = turf.bbox(feature as Feature<Polygon | MultiPolygon>);
                            map.fitBounds(
                              [
                                [bbox[0], bbox[1]],
                                [bbox[2], bbox[3]],
                              ],
                              {
                                padding: 50,
                                duration: 1000,
                              },
                            );
                          } else if (feature.geometry.type === "Point") {
                            const [lng, lat] = feature.geometry.coordinates;
                            map.flyTo({
                              center: [lng, lat],
                              zoom: 12,
                            });
                          }
                        } else {
                          // Fallback: use coordinates if available
                          if (area.coordinates) {
                            map.flyTo({
                              center: area.coordinates,
                              zoom: 12,
                            });
                          }
                        }
                      } else {
                        // Fallback: use coordinates if available
                        if (area.coordinates) {
                          map.flyTo({
                            center: area.coordinates,
                            zoom: 12,
                          });
                        }
                      }
                    };

                    const handleRemove = () => {
                      setSelectedAreas(
                        selectedAreas.filter(
                          (a) =>
                            !(
                              a.code === area.code &&
                              a.areaSetCode === area.areaSetCode
                            ),
                        ),
                      );
                    };

                    // Check if this area is the currently selected boundary in the inspector
                    const isSelectedInInspector = selectedBoundary?.areaCode === area.code &&
                      selectedBoundary?.areaSetCode === area.areaSetCode;

                    return (
                      <ContextMenu key={`${area.areaSetCode}-${area.code}`}>
                        <ContextMenuTrigger asChild>
                          <TableRow
                            className={cn(
                              "border-none font-medium my-1 cursor-pointer",
                              isSelectedInInspector 
                                ? "bg-blue-50 hover:bg-blue-100" 
                                : "hover:bg-neutral-50"
                            )}
                            style={
                              area.isSelected
                                ? { borderLeft: "4px solid var(--brandGreen)" }
                                : isSelectedInInspector
                                  ? { borderLeft: "4px solid #3b82f6" }
                                  : undefined
                            }
                            onClick={handleMakeSelected}
                          >
                            <TableCell className="py-2 px-2 h-8 min-w-0 break-words" style={{ width: hasSecondaryData ? "40%" : "60%" }}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-4 h-4 rounded flex-shrink-0"
                                  style={{ backgroundColor: getAreaColor(area) }}
                                />
                                <span className="break-words min-w-0">{area.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-2 h-8 break-words text-right" style={{ width: hasSecondaryData ? "30%" : "40%", maxWidth: "80px" }}>
                              {primaryValue}
                            </TableCell>
                            {hasSecondaryData && (
                              <TableCell className="py-2 px-2 h-8 break-words text-right" style={{ width: "30%", maxWidth: "80px" }}>
                                {secondaryValue}
                              </TableCell>
                            )}
                          </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={handleMakeSelected}>
                            Make selected area
                          </ContextMenuItem>
                          <ContextMenuItem onClick={handleFlyTo}>
                            <MapPin size={14} className="mr-2" />
                            Fly to this area
                          </ContextMenuItem>
                          <ContextMenuItem onClick={handleRemove} className="text-destructive">
                            <XIcon size={14} className="mr-2" />
                            Remove from list
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                  
                  {/* Placeholder row for hovered area preview - always at bottom when section is visible */}
                  {(() => {
                    // Only show hover preview when compare mode is enabled
                    const hasHoverArea = compareModeEnabled && hoverArea && !selectedAreas.some(
                      (a) =>
                        a.code === hoverArea.code &&
                        a.areaSetCode === hoverArea.areaSetCode,
                    );

                    if (hasHoverArea) {
                      const hoveredAreaStat =
                        areaStats.areaSetCode === hoverArea.areaSetCode
                          ? areaStats.stats.find(
                              (s) => s.areaCode === hoverArea.code,
                            )
                          : null;
                      const hoveredPrimaryValue = hoveredAreaStat
                        ? getDisplayValue(
                            areaStats.calculationType,
                            areaStats.primary,
                            hoveredAreaStat.primary,
                          )
                        : "-";
                      const hoveredSecondaryValue = hoveredAreaStat
                        ? getDisplayValue(
                            areaStats.calculationType,
                            areaStats.secondary,
                            hoveredAreaStat.secondary,
                          )
                        : "-";
                      const hoveredAreaColor = hoveredAreaStat
                        ? getAreaColor({
                            code: hoverArea.code,
                            areaSetCode: hoverArea.areaSetCode,
                          })
                        : "rgba(200, 200, 200, 1)";

                      return (
                        <TableRow className="border-t-2 border-dashed border-neutral-300 bg-neutral-50/50">
                          <TableCell className="py-2 px-2 h-8 min-w-0 break-words" style={{ width: hasSecondaryData ? "40%" : "60%" }}>
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-4 h-4 rounded flex-shrink-0 border-2 border-dashed border-neutral-400"
                                style={{ backgroundColor: hoveredAreaColor }}
                              />
                              <span className="text-muted-foreground italic break-words min-w-0">
                                {hoverArea.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-2 h-8 break-words text-right" style={{ width: hasSecondaryData ? "30%" : "40%", maxWidth: "80px" }}>
                            <span className="text-muted-foreground italic">
                              {hoveredPrimaryValue}
                            </span>
                          </TableCell>
                          {hasSecondaryData && (
                            <TableCell className="py-2 px-2 h-8 break-words text-right" style={{ width: "30%", maxWidth: "80px" }}>
                              <span className="text-muted-foreground italic">
                                {hoveredSecondaryValue}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    }

                    // Show placeholder when no area is hovered
                    return (
                      <TableRow className="border-t-2 border-dashed border-neutral-300 bg-neutral-50/50">
                        <TableCell className="py-2 px-2 h-8 min-w-0 break-words" style={{ width: hasSecondaryData ? "40%" : "60%" }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-4 h-4 rounded flex-shrink-0 border-2 border-dashed border-neutral-300 bg-neutral-100" />
                            <span className="text-muted-foreground italic text-sm break-words min-w-0">
                              Hover over area to preview
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2 h-8 break-words text-right" style={{ width: hasSecondaryData ? "30%" : "40%", maxWidth: "80px" }}>
                          <span className="text-muted-foreground italic text-sm">-</span>
                        </TableCell>
                        {hasSecondaryData && (
                          <TableCell className="py-2 px-2 h-8 break-words text-right" style={{ width: "30%", maxWidth: "80px" }}>
                            <span className="text-muted-foreground italic text-sm">-</span>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })()}
              </TableBody>
            </Table>
            
            {/* Toggle button at bottom */}
            {compareModeEnabled !== undefined && (  
              <div className="px-3 py-2 ">
                <button
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors",
                    compareModeEnabled
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "border text-neutral-700 hover:bg-neutral-300",
                  )}
                  onClick={() => {
                    if (onStopAdding) {
                      onStopAdding();
                    }
                  }}
                  title={
                    compareModeEnabled
                      ? "Stop adding areas to list"
                      : "Start adding areas to list"
                  }
                >
                  {compareModeEnabled ? (
                    <>
                      <span>Stop adding to list</span>
                    </>
                  ) : (
                    <>
                      <span>Add to list</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
