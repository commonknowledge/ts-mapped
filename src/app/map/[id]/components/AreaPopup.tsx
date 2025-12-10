import { expression } from "mapbox-gl/dist/style-spec/index.cjs";
import { Popup } from "react-map-gl/mapbox";
import { ColumnType } from "@/server/models/DataSource";
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import { formatNumber } from "@/utils/text";
import { useFillColor } from "../colors";
import { useAreaStats } from "../data";
import { useChoroplethDataSource } from "../hooks/useDataSources";
import { useMapViews } from "../hooks/useMapViews";
import type { AreaSetCode } from "@/server/models/AreaSet";

export default function AreaPopup({
  areaSetCode,
  code,
  name,
  coordinates,
}: {
  areaSetCode: AreaSetCode;
  code: string;
  name: string;
  coordinates: [number, number];
}) {
  const { viewConfig } = useMapViews();
  const choroplethDataSource = useChoroplethDataSource();

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;

  const areaStat =
    areaStats?.areaSetCode === areaSetCode
      ? areaStats?.stats.find((s) => s.areaCode === code)
      : null;

  const primaryDisplayValue = getDisplayValue(
    areaStats?.calculationType,
    areaStats?.primary,
    areaStat?.primary,
  );
  const secondaryDisplayValue = getDisplayValue(
    areaStats?.calculationType,
    areaStats?.secondary,
    areaStat?.secondary,
  );

  const fillColor = useFillColor({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isReversed: Boolean(viewConfig.reverseColorScheme),
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
    return null;
  }

  // If using a bivariate color scheme, separate out the colors
  // here so the user can easily see the value along each dimension
  const primaryColor = fillColorExpression.evaluate(
    { zoom: 0 },
    { type: "Polygon", properties: {} },
    {
      value: areaStat?.primary || 0,
      secondaryValue: 0, // Only look at primary stat
    },
  );

  const secondaryColor = fillColorExpression.evaluate(
    { zoom: 0 },
    { type: "Polygon", properties: {} },
    {
      value: 0, // Only look at secondary stat
      secondaryValue: areaStat?.secondary,
    },
  );

  const statLabel =
    areaStats?.calculationType === CalculationType.Count
      ? `${choroplethDataSource?.name || "Unknown"} count`
      : viewConfig.areaDataColumn;

  return (
    <Popup
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      closeButton={false}
    >
      <div className="font-sans text-sm flex flex-col gap-2">
        <p className="font-semibold">{name}</p>
        {areaStats?.primary && (
          <div className="flex gap-2 items-center">
            <div
              className="h-4 w-4 shrink-0 rounded-sm"
              style={{ backgroundColor: toRGBA(primaryColor) }}
            ></div>
            <p>
              {statLabel}: {primaryDisplayValue}
            </p>
          </div>
        )}
        {areaStats?.secondary && (
          <div className="flex gap-2 items-center">
            <div
              className="h-4 w-4 shrink-0 rounded-sm"
              style={{ backgroundColor: toRGBA(secondaryColor) }}
            ></div>
            <p>
              {viewConfig.areaDataSecondaryColumn}: {secondaryDisplayValue}
            </p>
          </div>
        )}
      </div>
    </Popup>
  );
}

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
  if (areaStats.minValue >= 0 && areaStats.maxValue <= 1) {
    return `${Math.round(value * 1000) / 10}%`;
  }
  return formatNumber(value);
};
