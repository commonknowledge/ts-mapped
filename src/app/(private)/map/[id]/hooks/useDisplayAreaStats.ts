import { expression } from "mapbox-gl/dist/style-spec/index.cjs";
import { useMemo } from "react";
import { CalculationType } from "@/models/MapView";
import { resolveColumnMetadata } from "@/utils/resolveColumnMetadata";
import { useFillColor } from "../colors";
import { DEFAULT_FILL_COLOR } from "../constants";
import { useAreaStats } from "../data";
import { getDisplayValue } from "../utils/stats";
import { useChoroplethDataSource } from "./useDataSources";
import { useMapViews } from "./useMapViews";
import type { AreaSetCode } from "@/models/AreaSet";

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

  const resolvedMetadata = useMemo(
    () =>
      resolveColumnMetadata(
        choroplethDataSource?.columnMetadata ?? [],
        choroplethDataSource?.organisationOverride?.columnMetadata,
      ),
    [choroplethDataSource],
  );

  const columnMetadata = resolvedMetadata.find(
    (c) => c.name === areaStats?.primary?.column,
  );

  const secondaryColumnMetadata = resolvedMetadata.find(
    (c) => c.name === areaStats?.secondary?.column,
  );

  const fillColor = useFillColor({
    areaStats,
    viewConfig,
    selectedBivariateBucket: null,
    resolvedColorMappings: columnMetadata?.valueColors,
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
        primaryDisplayValue: getDisplayValue(areaStat?.primary, {
          calculationType: areaStats?.calculationType,
          columnType: areaStats?.primary?.columnType,
          columnMetadata,
        }),
        secondaryDisplayValue: getDisplayValue(areaStat?.secondary, {
          calculationType: areaStats?.calculationType,
          columnType: areaStats?.secondary?.columnType,
          columnMetadata: secondaryColumnMetadata,
        }),

        backgroundColor: toRGBA(colorResult),
      };
    });
  }, [
    areas,
    areaStats,
    result,
    fillColorExpression,
    columnMetadata,
    secondaryColumnMetadata,
  ]);

  const primaryLabel = areaStats
    ? areaStats.calculationType === CalculationType.Count
      ? `${choroplethDataSource?.name || "Unknown"} count`
      : viewConfig.areaDataColumn
    : "";

  return {
    areasToDisplay,
    primaryLabel,
    primaryDescription: resolvedMetadata.find(
      (c) => c.name === areaStats?.primary?.column,
    )?.description,
    secondaryLabel: viewConfig.areaDataSecondaryColumn,
    secondaryDescription: resolvedMetadata.find(
      (c) => c.name === areaStats?.secondary?.column,
    )?.description,
  };
};

export const useDisplayAreaStat = <
  T extends { code: string; name: string; areaSetCode: AreaSetCode },
>(
  area: T | null | undefined,
) => {
  const {
    areasToDisplay,
    primaryLabel,
    secondaryLabel,
    primaryDescription,
    secondaryDescription,
  } = useDisplayAreaStats(area ? [area] : []);
  return {
    areaToDisplay: areasToDisplay.length ? areasToDisplay[0] : null,
    primaryLabel,
    secondaryLabel,
    primaryDescription,
    secondaryDescription,
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
