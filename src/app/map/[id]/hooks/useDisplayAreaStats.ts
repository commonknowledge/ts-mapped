import { expression } from "mapbox-gl/dist/style-spec/index.cjs";
import { useMemo } from "react";
import { CalculationType } from "@/server/models/MapView";
import { useFillColor } from "../colors";
import { DEFAULT_FILL_COLOR } from "../constants";
import { useAreaStats } from "../data";
import { getDisplayValue } from "../utils/stats";
import { useChoroplethDataSource } from "./useDataSources";
import { useMapViews } from "./useMapViews";
import type { AreaSetCode } from "@/server/models/AreaSet";

export interface DisplayAreaStat {
  code: string;
  name: string;
  areaSetCode: AreaSetCode;
  primaryDisplayValue: string;
  secondaryDisplayValue?: string;
  backgroundColor: string;
}

export const useDisplayAreaStats = <
  T extends { code: string; name: string; areaSetCode: AreaSetCode },
>(
  areas: T[],
) => {
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  const { viewConfig } = useMapViews();
  const choroplethDataSource = useChoroplethDataSource();

  const fillColor = useFillColor({
    areaStats,
    viewConfig,
    selectedBivariateBucket: null,
  });

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

  const areasToDisplay = useMemo((): (T & DisplayAreaStat)[] => {
    return areas.map((area) => {
      const areaStat = areaStats?.stats.find(
        (s) =>
          areaStats.areaSetCode === area.areaSetCode &&
          s.areaCode === area.code,
      );
      const colorResult =
        result === "success"
          ? fillColorExpression.evaluate(
              { zoom: 0 },
              { type: "Polygon", properties: {} },
              {
                value: areaStat?.primary || 0,
                secondaryValue: areaStat?.secondary || 0,
              },
            )
          : DEFAULT_FILL_COLOR;
      return {
        ...area,
        primaryDisplayValue: getDisplayValue(
          areaStat?.primary,
          areaStats?.primary,
        ),
        secondaryDisplayValue: getDisplayValue(
          areaStat?.secondary,
          areaStats?.secondary,
        ),
        backgroundColor: toRGBA(colorResult),
      };
    });
  }, [areaStats, fillColorExpression, result, areas]);

  const primaryLabel = areaStats
    ? areaStats.calculationType === CalculationType.Count
      ? `${choroplethDataSource?.name || "Unknown"} count`
      : viewConfig.areaDataColumn
    : "";

  return {
    areasToDisplay,
    primaryLabel,
    secondaryLabel: viewConfig.areaDataSecondaryColumn,
  };
};

export const useDisplayAreaStat = <
  T extends { code: string; name: string; areaSetCode: AreaSetCode },
>(
  area: T | null | undefined,
) => {
  const { areasToDisplay, primaryLabel, secondaryLabel } = useDisplayAreaStats(
    area ? [area] : [],
  );
  return {
    areaToDisplay: areasToDisplay.length ? areasToDisplay[0] : null,
    primaryLabel,
    secondaryLabel,
  };
};

export const toRGBA = (expressionResult: unknown) => {
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
