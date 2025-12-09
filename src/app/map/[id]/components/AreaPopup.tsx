import { expression } from "mapbox-gl/dist/style-spec/index.cjs";
import { Popup } from "react-map-gl/mapbox";
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import { useFillColor } from "../colors";
import { useAreaStats } from "../data";
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

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;

  const areaStat =
    areaStats?.areaSetCode === areaSetCode
      ? areaStats?.stats.find((s) => s.areaCode === code)
      : null;

  const fillColor = useFillColor({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isCount: viewConfig.calculationType === CalculationType.Count,
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
      value: areaStat?.primary,
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

  return (
    <Popup
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      closeButton={false}
    >
      <div className="font-sans text-sm flex flex-col gap-2">
        <p className="font-semibold">{name}</p>
        {areaStat && (
          <div className="flex gap-2 items-center">
            <div
              className="h-4 w-4 shrink-0 rounded-sm"
              style={{ backgroundColor: toRGBA(primaryColor) }}
            ></div>
            <p>
              {viewConfig.areaDataColumn}: {String(areaStat.primary)}
            </p>
          </div>
        )}
        {areaStat && viewConfig.areaDataSecondaryColumn && (
          <div className="flex gap-2 items-center">
            <div
              className="h-4 w-4 shrink-0 rounded-sm"
              style={{ backgroundColor: toRGBA(secondaryColor) }}
            ></div>
            <p>
              {viewConfig.areaDataSecondaryColumn}: {String(areaStat.secondary)}
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
