import { Database } from "lucide-react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useChoroplethDataSource } from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY } from "@/constants";
import { ColumnType } from "@/server/models/DataSource";
import { CalculationType, ColorScheme } from "@/server/models/MapView";
import { formatNumber } from "@/utils/text";
import { useColorScheme } from "../colors";
import { useAreaStats } from "../data";
import BivariateLegend from "./BivariateLagend";

export default function Legend() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
  const { setBoundariesPanelOpen } = useChoropleth();

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;

  const colorScheme = useColorScheme({
    areaStats,
    scheme: viewConfig.colorScheme || ColorScheme.RedBlue,
    isReversed: Boolean(viewConfig.reverseColorScheme),
    categoryColors: viewConfig.categoryColors,
  });
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
      {areaStats?.calculationType !== CalculationType.Count &&
      viewConfig.areaDataColumn &&
      viewConfig.areaDataSecondaryColumn ? (
        <button
          onClick={() => setBoundariesPanelOpen(true)}
          className="p-2 pt-0 hover:bg-neutral-50 transition-colors cursor-pointer text-left w-full"
        >
          <BivariateLegend />
        </button>
      ) : (
        <button
          onClick={() => setBoundariesPanelOpen(true)}
          className="flex flex-col hover:bg-neutral-50 transition-colors cursor-pointer text-left w-full"
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
        </button>
      )}
    </div>
  );
}
