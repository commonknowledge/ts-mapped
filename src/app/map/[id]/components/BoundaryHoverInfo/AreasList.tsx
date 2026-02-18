import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import type { SelectedArea } from "../../atoms/selectedAreasAtom";
import type { AreaSetCode } from "@/server/models/AreaSet";

interface AreasListProps {
  areas: {
    code: string;
    areaSetCode: AreaSetCode;
    name: string;
    coordinates: [number, number];
    isSelected: boolean;
    primaryDisplayValue: string;
    secondaryDisplayValue?: string | null | undefined;
    backgroundColor: string;
  }[];
  primaryLabel: string;
  secondaryLabel?: string | null | undefined;
  setSelectedAreas: (as: SelectedArea[]) => void;
}

export function AreasList({
  areas,
  primaryLabel,
  secondaryLabel,
  setSelectedAreas,
}: AreasListProps) {
  const multipleAreas = areas.length > 1;

  return (
    <Table
      className="border-none"
      style={{ tableLayout: "auto", width: "auto" }}
    >
      {multipleAreas && (
        <TableHeader className="pointer-events-auto">
          <TableRow className="border-none hover:bg-transparent uppercase font-mono">
            <TableHead className="py-2 px-3 text-left h-8" />
            <TableHead className="py-2 px-3 text-muted-foreground text-xs text-left h-8">
              {primaryLabel}
            </TableHead>
            {secondaryLabel && (
              <TableHead className="py-2 px-3 text-muted-foreground text-xs text-left h-8">
                {secondaryLabel}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {areas.map((area) => {
          return (
            <TableRow
              key={`${area.areaSetCode}-${area.code}`}
              className={`border-none font-medium my-1 ${
                area.isSelected
                  ? "hover:bg-neutral-50 cursor-pointer pointer-events-auto"
                  : "cursor-default"
              }`}
              style={
                area.isSelected
                  ? { borderLeft: "4px solid var(--brandGreen)" }
                  : undefined
              }
              onClick={() => {
                // Remove from selected areas
                setSelectedAreas(
                  areas.filter(
                    (a) =>
                      !(
                        a.code === area.code &&
                        a.areaSetCode === area.areaSetCode
                      ),
                  ),
                );
              }}
            >
              <TableCell className="py-2 px-3 truncate h-8">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded shrink-0"
                    style={{ backgroundColor: area.backgroundColor }}
                  />
                  <span className="truncate">{area.name}</span>
                </div>
              </TableCell>
              {area.primaryDisplayValue && !multipleAreas && (
                <TableCell className="px-2 py-2 h-8">
                  <div className="w-px bg-neutral-200 h-full" />
                </TableCell>
              )}
              <TableCell className="py-2 px-3 whitespace-normal h-8">
                {multipleAreas ? (
                  area.primaryDisplayValue || "-"
                ) : (
                  <div className="flex flex-row justify-center items-center text-right">
                    <span className="mr-3 text-muted-foreground uppercase font-mono text-xs">
                      {primaryLabel}:
                    </span>
                    <span>{area.primaryDisplayValue}</span>
                  </div>
                )}
              </TableCell>
              {secondaryLabel && (
                <TableCell className="py-2 px-3 whitespace-normal h-8">
                  {multipleAreas ? (
                    area.secondaryDisplayValue || "-"
                  ) : (
                    <div className="flex flex-row justify-center items-center text-right">
                      <span className="mr-3 text-muted-foreground uppercase font-mono text-xs">
                        {secondaryLabel}:
                      </span>
                      <span>{area.secondaryDisplayValue}</span>
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
