"use client";

import { InfoIcon } from "lucide-react";
import { useMemo } from "react";
import { useChoroplethDataSource } from "@/hooks/useDataSources";
import { AreaSetGroupCodeLabels } from "@/labels";
import { AreaSetGroupCode } from "@/models/AreaSet";
import { MapType } from "@/models/MapView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import { getValidAreaSetGroupCodes } from "../../components/Choropleth/areas";
import { useMapViews } from "../../hooks/useMapViews";
import LightCustomAreas from "./LightCustomAreas";
import LightOverlayBoundaries from "./LightOverlayBoundaries";
import LightSection from "./LightSection";

// The boundary sets most maps use, as a one-click switch; the rest are in
// the dropdown below
const QUICK_BOUNDARIES: { code: AreaSetGroupCode; label: string }[] = [
  { code: AreaSetGroupCode.WMC24, label: "Westminster" },
  { code: AreaSetGroupCode.LAD25, label: "Councils" },
  { code: AreaSetGroupCode.UKR18, label: "Regions" },
];

const NONE = "none";

const isAreaSetGroupCode = (value: string): value is AreaSetGroupCode =>
  value in AreaSetGroupCodeLabels;

export default function LightBoundariesSection() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const current = viewConfig.areaSetGroupCode ?? null;
  const isHex = viewConfig.mapType === MapType.Hex;

  // Only offer sets the visualised data can be grouped into, as the classic
  // legend does; with no data visualised, every set is valid
  const dataSource = useChoroplethDataSource();
  const validCodes = useMemo(
    () => getValidAreaSetGroupCodes(dataSource?.geocodingConfig),
    [dataSource?.geocodingConfig],
  );
  const isFiltered =
    Boolean(dataSource) &&
    validCodes.length < Object.keys(AreaSetGroupCodeLabels).length;

  const setBoundary = (code: AreaSetGroupCode | null) =>
    updateViewConfig({ areaSetGroupCode: code });

  return (
    <LightSection label="Boundaries">
      {isHex ? (
        <p className="text-xs text-neutral-500">
          Hex maps always use Westminster constituencies.
        </p>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label="Boundaries"
            className="grid grid-cols-3 gap-0.5 rounded-md bg-neutral-100 p-0.5"
          >
            {QUICK_BOUNDARIES.map(({ code, label }) => {
              const isValid = validCodes.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={current === code}
                  disabled={!isValid}
                  title={
                    isValid
                      ? AreaSetGroupCodeLabels[code]
                      : `${dataSource?.name} can't be grouped by ${label.toLowerCase()}`
                  }
                  onClick={() => setBoundary(current === code ? null : code)}
                  className={cn(
                    "cursor-pointer truncate rounded px-1 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40",
                    current === code
                      ? "bg-white font-medium shadow-sm"
                      : "text-neutral-500 enabled:hover:text-neutral-900",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <Select
              value={current ?? NONE}
              onValueChange={(value) =>
                setBoundary(isAreaSetGroupCode(value) ? value : null)
              }
            >
              <SelectTrigger
                size="sm"
                className="h-7 min-w-0 flex-1 text-xs"
                aria-label="All boundary sets"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE} className="text-xs">
                  No boundaries
                </SelectItem>
                {validCodes.map((code) => (
                  <SelectItem key={code} value={code} className="text-xs">
                    {AreaSetGroupCodeLabels[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFiltered && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    aria-label="Why are some boundaries missing?"
                    className="shrink-0 cursor-help text-neutral-400 hover:text-neutral-700"
                  >
                    <InfoIcon className="size-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-56">
                  Showing boundaries that work with {dataSource?.name}.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <LightOverlayBoundaries />
        </>
      )}
      <LightCustomAreas />
    </LightSection>
  );
}
