import { useAtom } from "jotai";
import { XIcon } from "lucide-react";
import { expression } from "mapbox-gl/dist/style-spec/index.cjs";
import { useMemo, useState } from "react";

import { ColumnType } from "@/server/models/DataSource";
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { formatNumber } from "@/utils/text";

import { selectedAreasAtom } from "../atoms/selectedAreasAtom";
import { useFillColor } from "../colors";
import { useAreaStats } from "../data";
import { useChoroplethDataSource } from "../hooks/useDataSources";
import { useHoverArea } from "../hooks/useMapHover";
import { useMapViews } from "../hooks/useMapViews";
import { useShowControls } from "../hooks/useMapControls";
import { CONTROL_PANEL_WIDTH } from "../styles";

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

export default function AreaInfo() {
  const [hoverArea] = useHoverArea();
  const [hoveredRowArea, setHoveredRowArea] = useState<{
    code: string;
    areaSetCode: string;
    name: string;
    coordinates: [number, number];
  } | null>(null);
  const [selectedAreas, setSelectedAreas] = useAtom(selectedAreasAtom);
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  const choroplethDataSource = useChoroplethDataSource();
  const { viewConfig } = useMapViews();
  const showControls = useShowControls();

  const fillColor = useFillColor({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isReversed: Boolean(viewConfig.reverseColorScheme),
    selectedBivariateBucket: null,
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

    // Add hover area only if it's not already in selected areas
    if (hoverArea) {
      const isHoverAreaSelected = selectedAreas.some(
        (a) =>
          a.code === hoverArea.code && a.areaSetCode === hoverArea.areaSetCode,
      );
      if (!isHoverAreaSelected) {
        areas.push({
          code: hoverArea.code,
          name: hoverArea.name,
          areaSetCode: hoverArea.areaSetCode,
          coordinates: hoverArea.coordinates,
          isSelected: false,
        });
      }
    }

    // Add hovered row area even if it's no longer in hoverArea
    if (hoveredRowArea) {
      const isAreaAlreadyDisplayed = areas.some(
        (a) =>
          a.code === hoveredRowArea.code &&
          a.areaSetCode === hoveredRowArea.areaSetCode,
      );
      if (!isAreaAlreadyDisplayed) {
        areas.push({
          code: hoveredRowArea.code,
          name: hoveredRowArea.name,
          areaSetCode: hoveredRowArea.areaSetCode,
          coordinates: hoveredRowArea.coordinates,
          isSelected: false,
        });
      }
    }

    return areas;
  }, [selectedAreas, hoverArea, hoveredRowArea]);

  const multipleAreas = selectedAreas.length > 1;
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
  if (!areaStats || areasToDisplay.length === 0) {
    return null;
  }

  // Center the info panel, accounting for the control panel when it's open
  const absolutelyCenter = {
    transform: showControls
      ? `translate(calc(-50% + ${CONTROL_PANEL_WIDTH / 2}px))`
      : "translate(-50%)",
  };

  return (
    <div
      className="absolute top-4 left-1/2 z-50 pointer-events-none transition-transform duration-300"
      style={absolutelyCenter}
    >
      <div className="bg-white rounded shadow-lg py-1 pr-8 relative pointer-events-auto" style={{ maxWidth: "400px", minWidth: "200px" }}>
        {selectedAreas.length > 0 && (
          <button
            className="absolute top-2 right-2 p-1 cursor-pointer hover:bg-neutral-100 rounded transition-colors z-20"
            aria-label="Clear selected areas"
            onClick={() => setSelectedAreas([])}
          >
            <XIcon
              size={16}
              className="text-neutral-600 hover:text-neutral-900"
            />
          </button>
        )}
        <Table
          className="border-none"
          style={{ tableLayout: "auto", width: "100%", minWidth: "200px" }}
        >
          {multipleAreas && (
            <TableHeader className="">
              <TableRow className="border-none hover:bg-transparent uppercase font-mono">
                <TableHead className="py-2 px-3 text-left h-8" />
                <TableHead className="py-2 px-3 text-muted-foreground text-xs text-left h-8">
                  {statLabel}
                </TableHead>
                {hasSecondaryData && (
                  <TableHead className="py-2 px-3 text-muted-foreground text-xs text-left h-8">
                    {viewConfig.areaDataSecondaryColumn}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
          )}
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

              return (
                <TableRow
                  key={`${area.areaSetCode}-${area.code}`}
                  className={`border-none font-medium my-1 ${area.isSelected
                      ? "hover:bg-neutral-50 cursor-pointer"
                      : "cursor-default"
                    }`}
                  style={
                    area.isSelected
                      ? { borderLeft: "4px solid var(--brandGreen)" }
                      : undefined
                  }
                  onMouseEnter={() => {
                    if (!area.isSelected) {
                      setHoveredRowArea(area);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredRowArea(null);
                  }}
                  onClick={() => {
                    if (area.isSelected) {
                      // Remove from selected areas
                      setSelectedAreas(
                        selectedAreas.filter(
                          (a) =>
                            !(
                              a.code === area.code &&
                              a.areaSetCode === area.areaSetCode
                            ),
                        ),
                      );
                    } else {
                      // Add to selected areas
                      setSelectedAreas([
                        ...selectedAreas,
                        {
                          code: area.code,
                          name: area.name,
                          areaSetCode: area.areaSetCode,
                          coordinates: area.coordinates,
                        },
                      ]);
                    }
                  }}
                >
                  <TableCell className="py-2 px-3 h-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: getAreaColor(area) }}
                      />
                      <span className="break-words whitespace-normal">{area.name}</span>
                    </div>
                  </TableCell>
                  {!multipleAreas && (
                    <TableCell className="px-2 py-2 h-8">
                      <div className="w-px bg-neutral-200 h-full" />
                    </TableCell>
                  )}
                  <TableCell className="py-2 px-3 whitespace-normal h-auto">
                    {!multipleAreas ? (
                      <div className="flex flex-row justify-center items-center text-right">
                        <span className="mr-3 text-muted-foreground uppercase font-mono text-xs">
                          {statLabel}:
                        </span>
                        <span className="break-words">{primaryValue}</span>
                      </div>
                    ) : (
                      <span className="break-words">{primaryValue}</span>
                    )}
                  </TableCell>
                  {hasSecondaryData && (
                    <TableCell className="py-2 px-3 whitespace-normal h-auto">
                      {!multipleAreas ? (
                        <div className="flex flex-row justify-center items-center text-right">
                          <span className="mr-3 text-muted-foreground uppercase font-mono text-xs">
                            {viewConfig.areaDataSecondaryColumn}:
                          </span>
                          <span className="break-words">{secondaryValue}</span>
                        </div>
                      ) : (
                        <span className="break-words">{secondaryValue}</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
