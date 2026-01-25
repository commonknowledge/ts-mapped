import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import { getDisplayValue } from "./utils";
import type { ColumnType } from "@/server/models/DataSource";
import type { CalculationType } from "@/server/models/MapView";

interface AreaStat {
  areaCode: string;
  primary?: unknown;
  secondary?: unknown;
}

interface AreaStats {
  areaSetCode: string;
  calculationType: CalculationType;
  primary: {
    column: string;
    columnType: ColumnType;
    minValue: number;
    maxValue: number;
  } | null;
  secondary: {
    column: string;
    columnType: ColumnType;
    minValue: number;
    maxValue: number;
  } | null;
  stats: AreaStat[];
}

interface AreasListProps {
  areas: {
    code: string;
    areaSetCode: string;
    name: string;
    coordinates: [number, number];
    isSelected: boolean;
  }[];
  statLabel: string;
  hasSecondaryData: boolean;
  secondaryColumnName?: string;
  areaStats: AreaStats | null;
  getAreaColor: (area: { code: string; areaSetCode: string }) => string;
  selectedAreas: {
    code: string;
    areaSetCode: string;
    name: string;
    coordinates: [number, number];
  }[];
  setSelectedAreas: (
    areas: {
      code: string;
      areaSetCode: string;
      name: string;
      coordinates: [number, number];
    }[],
  ) => void;
  onHoveredRowAreaChange: (
    area: {
      code: string;
      areaSetCode: string;
      name: string;
      coordinates: [number, number];
    } | null,
  ) => void;
}

export function AreasList({
  areas,
  statLabel,
  hasSecondaryData,
  secondaryColumnName,
  areaStats,
  getAreaColor,
  selectedAreas,
  setSelectedAreas,
  onHoveredRowAreaChange,
}: AreasListProps) {
  const multipleAreas = selectedAreas.length > 1;

  return (
    <Table
      className="border-none"
      style={{ tableLayout: "auto", width: "auto" }}
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
                {secondaryColumnName}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {areas.map((area) => {
          const areaStat =
            areaStats?.areaSetCode === area.areaSetCode
              ? areaStats.stats.find((s) => s.areaCode === area.code)
              : null;

          const primaryValue =
            areaStats && areaStat
              ? getDisplayValue(
                  areaStats.calculationType,
                  areaStats.primary,
                  areaStat.primary,
                )
              : null;
          const secondaryValue =
            areaStats && areaStat
              ? getDisplayValue(
                  areaStats.calculationType,
                  areaStats.secondary,
                  areaStat.secondary,
                )
              : null;

          return (
            <TableRow
              key={`${area.areaSetCode}-${area.code}`}
              className={`border-none font-medium my-1 ${
                area.isSelected
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
                  onHoveredRowAreaChange(area);
                }
              }}
              onMouseLeave={() => {
                onHoveredRowAreaChange(null);
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
              <TableCell className="py-2 px-3 truncate h-8">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded shrink-0"
                    style={{ backgroundColor: getAreaColor(area) }}
                  />
                  <span className="truncate">{area.name}</span>
                </div>
              </TableCell>
              {primaryValue && !multipleAreas && (
                <TableCell className="px-2 py-2 h-8">
                  <div className="w-px bg-neutral-200 h-full" />
                </TableCell>
              )}
              {areaStats && (
                <TableCell className="py-2 px-3 whitespace-normal h-8">
                  {multipleAreas ? (
                    primaryValue || "-"
                  ) : (
                    <div className="flex flex-row justify-center items-center text-right">
                      <span className="mr-3 text-muted-foreground uppercase font-mono text-xs">
                        {statLabel}:
                      </span>
                      <span>{primaryValue}</span>
                    </div>
                  )}
                </TableCell>
              )}
              {hasSecondaryData && (
                <TableCell className="py-2 px-3 whitespace-normal h-8">
                  {multipleAreas ? (
                    secondaryValue || "-"
                  ) : (
                    <div className="flex flex-row justify-center items-center text-right">
                      <span className="mr-3 text-muted-foreground uppercase font-mono text-xs">
                        {secondaryColumnName}:
                      </span>
                      <span>{secondaryValue}</span>
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
