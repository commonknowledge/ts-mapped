import { ColumnType } from "@/server/models/DataSource";
import { CalculationType } from "@/server/models/MapView";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
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
    <div className="bg-white rounded-lg shadow-sm p-0 border border-border overflow-hidden">
      <Table
        className="border-none"
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        <TableHeader className="">
          <TableRow className="border-none hover:bg-transparent uppercase font-mono">
            <TableHead className="py-2 px-3  text-left w-3/12 h-10" />
            <TableHead className="py-2 px-3 text-muted-foreground text-xs  text-left w-4.5/12 h-10">
              {statLabel}
            </TableHead>
            <TableHead className="py-2 px-3 text-muted-foreground text-xs text-left w-4.5/12 h-10">
              {viewConfig.areaDataSecondaryColumn || "Secondary"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="border-none hover:bg-neutral-50 font-medium">
            <TableCell className="py-2 px-3 w-3/12 truncate h-10">
              {hoverArea.name}
            </TableCell>
            <TableCell className="py-2 px-3 w-4.5/12 whitespace-normal h-10">
              {primaryValue}
            </TableCell>
            <TableCell className="py-2 px-3 w-4.5/12 whitespace-normal h-10">
              {secondaryValue}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
