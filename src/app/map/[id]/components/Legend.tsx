import { Database } from "lucide-react";
import { useChoroplethDataSource } from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY } from "@/constants";
import { ColumnType } from "@/server/models/DataSource";
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";
import { CHOROPLETH_COLOR_SCHEMES, useColorScheme } from "../colors";
import { useAreaStats } from "../data";
import BivariateLegend from "./BivariateLagend";

export default function Legend() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;

  const colorScheme = useColorScheme(
    areaStats,
    viewConfig.colorScheme || ColorScheme.RedBlue,
    viewConfig.calculationType === CalculationType.Count,
    Boolean(viewConfig.reverseColorScheme),
  );
  if (!colorScheme) {
    return null;
  }

  const makeBars = () => {
    let bars;
    if (colorScheme.columnType === ColumnType.Number) {
      const numStops = 24;
      const stops = new Array(numStops + 1)
        .fill(null)
        .map((_, i) => {
          const t = i / numStops;
          const value =
            colorScheme.minValue +
            t * (colorScheme.maxValue - colorScheme.minValue);
          const color = colorScheme.colorScale(value);
          return `${color} ${t * 100}%`;
        })
        .join(", ");

      const numTicks = 5 as number; // number of numeric step labels
      const denom = Math.max(numTicks - 1, 1);

      bars = (
        <div className="w-full">
          <div
            className="w-full h-4 border border-neutral-200"
            style={{ background: `linear-gradient(to right, ${stops})` }}
          />
          <div className="relative mt-1 h-6">
            {Array.from({ length: numTicks }).map((_, i) => {
              const t = i / denom;
              const value =
                colorScheme.minValue +
                t * (colorScheme.maxValue - colorScheme.minValue);
              const positionStyle =
                i === 0
                  ? { left: 0, transform: "translateX(0%)" }
                  : i === numTicks - 1
                    ? { left: "100%", transform: "translateX(-100%)" }
                    : { left: `${t * 100}%`, transform: "translateX(-50%)" };
              const alignClass =
                i === 0
                  ? "items-start"
                  : i === numTicks - 1
                    ? "items-end"
                    : "items-center";
              return (
                <div
                  key={i}
                  className={`absolute flex flex-col ${alignClass}`}
                  style={positionStyle}
                >
                  <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                    {(() => {
                      const isPercent =
                        colorScheme.minValue >= 0 && colorScheme.maxValue <= 1;
                      return isPercent
                        ? `${Math.round(value * 100)}%`
                        : formatNumber(value);
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      bars = Object.keys(colorScheme.colorMap)
        .toSorted()
        .map((key) => (
          <div
            className="p-1 w-full items-center justify-center flex text-xs"
            key={key}
            style={{ backgroundColor: colorScheme.colorMap[key] }}
          >
            {key}
          </div>
        ));
    }
    return bars;
  };

  return (
    <div className="flex flex-col gap-1 rounded-sm overflow-auto bg-white border border-neutral-200 w-full">
      <p className=" flex  gap-2 items-center text-xs font-mono p-2">
        <Database className="w-4 h-4 text-muted-foreground" />
        Locality Data Legend
      </p>
      {viewConfig.areaDataColumn && viewConfig.areaDataSecondaryColumn ? (
        <div className="p-2 pt-0">
          <BivariateLegend />
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex flex-col",
                areaStats?.columnType === ColumnType.Number
                  ? "cursor-pointer"
                  : "",
              )}
            >
              <p className="flex items-center font-medium px-2 ">
                {dataSource?.name}
              </p>
              <p className="text-sm flex items-center gap-0.5 font-medium px-2 ">
                {viewConfig.areaDataColumn === MAX_COLUMN_KEY
                  ? "Highest-value column"
                  : viewConfig.calculationType === CalculationType.Count
                    ? "Count"
                    : viewConfig.areaDataColumn}
              </p>
              <div className="flex px-2 ">{makeBars()}</div>
            </div>
          </DropdownMenuTrigger>
          {areaStats?.columnType === ColumnType.Number && (
            <DropdownMenuContent>
              <DropdownMenuLabel>Choose colour scheme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CHOROPLETH_COLOR_SCHEMES.map((option, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() =>
                    updateViewConfig({ colorScheme: option.value })
                  }
                  className="flex items-center gap-2"
                >
                  <div className={`w-4 h-4 rounded ${option.color}`} />
                  <span className="truncate">{option.label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Switch
                  id="reverse-color-scheme-switch"
                  checked={Boolean(viewConfig?.reverseColorScheme)}
                  onClick={() =>
                    updateViewConfig({
                      reverseColorScheme: !viewConfig?.reverseColorScheme,
                    })
                  }
                  onCheckedChange={() =>
                    updateViewConfig({
                      reverseColorScheme: !viewConfig?.reverseColorScheme,
                    })
                  }
                />
                <label
                  htmlFor="reverse-color-scheme-switch"
                  className="text-sm cursor-pointer"
                >
                  Reverse colors
                </label>
              </div>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * Display a shortened version of the number according
 * to its size, to 3 significant figures.
 *
 * If v > 1 trillion, print e.g. 1.23t
 * If v > 1 billion, print e.g. 1.23b
 * If v > 1 million, print e.g. 1.23m
 * If v > 1 thousand, print e.g. 1.23k
 * Otherwise print to 3 s.f.
 */
const formatNumber = (v: number): string => {
  if (!isFinite(v)) return String(v);

  const sign = v < 0 ? "-" : "";
  const av = Math.abs(v);

  const to3sf = (n: number) => {
    // Use toPrecision to get 3 significant figures then clean up
    const s = n.toPrecision(3);
    // Convert exponential form to a plain number string when possible
    if (s.includes("e")) {
      return Number(s).toString();
    }
    // Strip trailing zeros from decimals (e.g. 12.00 -> 12)
    if (s.includes(".")) {
      return s.replace(/0+$/, "").replace(/\.$/, "");
    }

    return s;
  };

  if (av >= 1e12) return sign + to3sf(av / 1e12) + "t";
  if (av >= 1e9) return sign + to3sf(av / 1e9) + "b";
  if (av >= 1e6) return sign + to3sf(av / 1e6) + "m";
  if (av >= 1e3) return sign + to3sf(av / 1e3) + "k";

  return sign + to3sf(av);
};
