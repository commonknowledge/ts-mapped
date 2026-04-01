import type { SelectedArea } from "../../atoms/selectedAreasAtom";
import type { AreaSetCode } from "@/models/AreaSet";

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
    <div className="flex flex-col">
      {areas.map((area) => (
        <div
          key={`${area.areaSetCode}-${area.code}`}
          className={`px-3 py-2 font-medium ${area.isSelected
            ? "hover:bg-neutral-50 cursor-pointer pointer-events-auto"
            : "cursor-default"
            }`}
          style={
            area.isSelected
              ? { borderLeft: "4px solid var(--brandGreen)" }
              : undefined
          }
          onClick={() => {
            if (!area.isSelected) return;
            setSelectedAreas(
              areas.filter(
                (a) =>
                  !(a.code === area.code && a.areaSetCode === area.areaSetCode),
              ),
            );
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded shrink-0 border border-neutral-200"
              style={{ backgroundColor: area.backgroundColor }}
            />
            <span>{area.name}</span>
          </div>
          {primaryLabel && (
            <div className="mt-1 text-sm">
              {multipleAreas ? (
                <span>
                  <span className="text-muted-foreground uppercase font-mono text-xs">
                    {primaryLabel}:
                  </span>{" "}
                  {area.primaryDisplayValue || "-"}
                  {secondaryLabel && (
                    <span className="text-muted-foreground">
                      {" / "}
                      <span className="uppercase font-mono text-xs">
                        {secondaryLabel}:
                      </span>{" "}
                      {area.secondaryDisplayValue || "-"}
                    </span>
                  )}
                </span>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground uppercase font-mono text-xs">
                      {primaryLabel}:
                    </span>
                    <span>{area.primaryDisplayValue}</span>
                  </div>
                  {secondaryLabel && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground uppercase font-mono text-xs">
                        {secondaryLabel}:
                      </span>
                      <span>{area.secondaryDisplayValue || "-"}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
