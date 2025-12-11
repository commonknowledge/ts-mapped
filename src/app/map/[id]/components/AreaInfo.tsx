import { ColumnType } from "@/server/models/DataSource";
import { CalculationType } from "@/server/models/MapView";
import { formatNumber } from "@/utils/text";
import { useAreaStats } from "../data";
import { useChoroplethDataSource } from "../hooks/useDataSources";
import { useHoverArea } from "../hooks/useMapHover";
import { useMapViews } from "../hooks/useMapViews";

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

export default function AreaInfo() {
  const [hoverArea] = useHoverArea();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  const choroplethDataSource = useChoroplethDataSource();
  const { viewConfig } = useMapViews();

  if (!hoverArea || !areaStats) {
    return null;
  }

  const areaStat =
    areaStats.areaSetCode === hoverArea.areaSetCode
      ? areaStats.stats.find((s) => s.areaCode === hoverArea.code)
      : null;

  if (!areaStat) {
    return null;
  }

  const statLabel =
    areaStats.calculationType === CalculationType.Count
      ? `${choroplethDataSource?.name || "Unknown"} count`
      : viewConfig.areaDataColumn;

  const primaryValue = getDisplayValue(
    areaStats.calculationType,
    areaStats.primary,
    areaStat.primary,
  );
  const secondaryValue = getDisplayValue(
    areaStats.calculationType,
    areaStats.secondary,
    areaStat.secondary,
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-border">
      <div className="text-xs font-semibold text-muted-foreground mb-1">
        {hoverArea.name}
      </div>
      <div className="text-sm font-medium text-foreground">
        {primaryValue}
        {secondaryValue !== "-" && (
          <span className="text-xs text-muted-foreground ml-2">
            / {secondaryValue}
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{statLabel}</div>
    </div>
  );
}
