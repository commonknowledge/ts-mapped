import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { expression } from "mapbox-gl/dist/style-spec/index.cjs";
import { useMemo, useState } from "react";

import { CalculationType } from "@/server/models/MapView";

import { useFillColor } from "../../colors";
import { useAreaStats } from "../../data";
import { useChoroplethDataSource } from "../../hooks/useDataSources";
import { useHoverArea } from "../../hooks/useMapHover";
import { useMapViews } from "../../hooks/useMapViews";
import { useSelectedAreas } from "../../hooks/useSelectedAreas";
import { AreasList } from "./AreasList";
import { toRGBA } from "./utils";

export default function BoundaryHoverInfo() {
  const [hoverArea] = useHoverArea();
  const [hoveredRowArea, setHoveredRowArea] = useState<{
    code: string;
    areaSetCode: string;
    name: string;
    coordinates: [number, number];
  } | null>(null);
  const [selectedAreas, setSelectedAreas] = useSelectedAreas();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  const choroplethDataSource = useChoroplethDataSource();
  const { viewConfig } = useMapViews();

  const fillColor = useFillColor({
    areaStats,
    viewConfig,
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
        (a: { code: string; areaSetCode: string }) =>
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
          ? areaStats.stats.find(
              (s: { areaCode: string }) => s.areaCode === area.code,
            )
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

  return (
    <AnimatePresence mode="wait">
      {areasToDisplay.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, type: "tween" }}
          className="bg-white rounded shadow-lg py-1 pr-8 relative pointer-events-auto"
        >
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
          <AreasList
            areas={areasToDisplay}
            statLabel={statLabel}
            hasSecondaryData={hasSecondaryData}
            secondaryColumnName={viewConfig.areaDataSecondaryColumn}
            areaStats={areaStats}
            getAreaColor={getAreaColor}
            selectedAreas={selectedAreas}
            setSelectedAreas={setSelectedAreas}
            onHoveredRowAreaChange={setHoveredRowArea}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
