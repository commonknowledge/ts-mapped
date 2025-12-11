import { useAtom } from "jotai";
import { XIcon } from "lucide-react";

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

import { selectedAreasAtom } from "../atoms/selectedAreasAtom";
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
  const [selectedAreas, setSelectedAreas] = useAtom(selectedAreasAtom);
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery.data;
  const choroplethDataSource = useChoroplethDataSource();
  const { viewConfig } = useMapViews();

  if (!areaStats) {
    return null;
  }

  // Combine selected areas and hover area, avoiding duplicates
  const areasToDisplay = [];

  // Add all selected areas
  for (const selectedArea of selectedAreas) {
    areasToDisplay.push({
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
      areasToDisplay.push({
        code: hoverArea.code,
        name: hoverArea.name,
        areaSetCode: hoverArea.areaSetCode,
        coordinates: hoverArea.coordinates,
        isSelected: false,
      });
    }
  }

  if (areasToDisplay.length === 0) {
    return null;
  }

  const statLabel =
    areaStats.calculationType === CalculationType.Count
      ? `${choroplethDataSource?.name || "Unknown"} count`
      : viewConfig.areaDataColumn;

  return (
    <div className="bg-white rounded shadow-lg py-2 pr-8 relative pointer-events-auto">
      {selectedAreas.length > 0 && (
        <button
          className="absolute top-3 right-3 p-1 cursor-pointer hover:bg-neutral-100 rounded transition-colors z-20"
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
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        <TableHeader className="">
          <TableRow className="border-none hover:bg-transparent uppercase font-mono">
            <TableHead className="py-2 px-3  text-left w-3/12 h-8" />
            <TableHead className="py-2 px-3 text-muted-foreground text-xs  text-left w-4.5/12 h-8">
              {statLabel}
            </TableHead>
            <TableHead className="py-2 px-3 text-muted-foreground text-xs text-left w-4.5/12 h-8">
              {viewConfig.areaDataSecondaryColumn || "Secondary"}
            </TableHead>
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

            return (
              <TableRow
                key={`${area.areaSetCode}-${area.code}`}
                className="border-none font-medium hover:bg-neutral-50 cursor-pointer"
                style={
                  area.isSelected
                    ? { borderLeft: "4px solid var(--brandGreen)" }
                    : undefined
                }
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
                <TableCell className="py-2 px-3 w-3/12 truncate h-8">
                  {area.name}
                </TableCell>
                <TableCell className="py-2 px-3 w-4.5/12 whitespace-normal h-8">
                  {primaryValue}
                </TableCell>
                <TableCell className="py-2 px-3 w-4.5/12 whitespace-normal h-8">
                  {secondaryValue}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
