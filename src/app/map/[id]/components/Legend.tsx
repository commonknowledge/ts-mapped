import { ChevronRight, Eye, EyeOff, LoaderPinwheel } from "lucide-react";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";
import { useChoroplethDataSource } from "@/app/map/[id]/hooks/useDataSources";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { MAX_COLUMN_KEY } from "@/constants";
import { ColumnType } from "@/server/models/DataSource";
import { CalculationType, ColorScaleType } from "@/server/models/MapView";
import { formatNumber } from "@/utils/text";
import { calculateStepColor, useColorScheme } from "../colors";
import { useAreaStats } from "../data";
import BivariateLegend from "./BivariateLagend";
import { getChoroplethDataKey } from "./Choropleth/utils";

export default function Legend() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const dataSource = useChoroplethDataSource();
  const { setBoundariesPanelOpen } = useChoropleth();

  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  const isLoading = areaStatsQuery?.isFetching;

  const colorScheme = useColorScheme({
    areaStats,
    viewConfig,
  });

  const isLayerVisible = viewConfig.showChoropleth !== false;

  const toggleLayerVisibility = () => {
    updateViewConfig({ showChoropleth: !isLayerVisible });
  };

  const hasDataSource = Boolean(viewConfig.areaDataSourceId);
  const hasColumn = Boolean(
    viewConfig.areaDataColumn ||
    viewConfig.calculationType === CalculationType.Count,
  );
  const isBivariate =
    areaStats?.calculationType !== CalculationType.Count &&
    viewConfig.areaDataColumn &&
    viewConfig.areaDataSecondaryColumn;

  if (!hasDataSource) {
    return null;
  }

  const getColumnLabel = () => {
    if (!hasColumn) {
      return "No column selected";
    }
    if (viewConfig.areaDataColumn === MAX_COLUMN_KEY) {
      return "Highest-value column";
    }
    if (viewConfig.calculationType === CalculationType.Count) {
      return "Count";
    }
    if (viewConfig.areaDataSecondaryColumn) {
      return `${viewConfig.areaDataColumn} vs ${viewConfig.areaDataSecondaryColumn}`;
    }
    return viewConfig.areaDataColumn;
  };

  const makeBars = () => {
    if (!colorScheme) return null;

    if (colorScheme.colorSchemeType === "numeric") {
      // Handle stepped colors
      const steppedColorSteps =
        viewConfig.steppedColorStepsByKey?.[getChoroplethDataKey(viewConfig)];
      if (
        viewConfig.colorScaleType === ColorScaleType.Stepped &&
        steppedColorSteps &&
        steppedColorSteps.length > 0
      ) {
        const sortedSteps = [...steppedColorSteps].sort(
          (a, b) => a.start - b.start,
        );
        const range = colorScheme.maxValue - colorScheme.minValue;

        // Collect all unique boundary positions
        const boundaries = new Set<number>();
        boundaries.add(colorScheme.minValue);
        sortedSteps.forEach((step) => {
          boundaries.add(step.start);
          boundaries.add(step.end);
        });
        boundaries.add(colorScheme.maxValue);
        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

        return (
          <div className="w-full">
            <div className="flex w-full h-4 border border-neutral-200 overflow-hidden rounded">
              {sortedSteps.map((step, index) => {
                const stepStart = Math.max(step.start, colorScheme.minValue);
                const stepEnd =
                  index < sortedSteps.length - 1
                    ? sortedSteps[index + 1].start
                    : Math.min(step.end, colorScheme.maxValue);
                const width =
                  range > 0
                    ? ((stepEnd - stepStart) / range) * 100
                    : 100 / sortedSteps.length;
                return (
                  <div
                    key={index}
                    className="h-full border-r border-neutral-400 last:border-r-0"
                    style={{
                      width: `${width}%`,
                      backgroundColor: calculateStepColor(
                        index,
                        sortedSteps.length,
                        viewConfig,
                      ),
                    }}
                  />
                );
              })}
            </div>
            <div className="relative mt-1 h-6">
              {sortedBoundaries.map((boundary, index) => {
                const isFirst = index === 0;
                const isLast = index === sortedBoundaries.length - 1;
                const position =
                  range > 0
                    ? ((boundary - colorScheme.minValue) / range) * 100
                    : (index / (sortedBoundaries.length - 1)) * 100;

                return (
                  <div
                    key={index}
                    className="absolute flex flex-col"
                    style={{
                      left: `${position}%`,
                      transform: isFirst
                        ? "translateX(0%)"
                        : isLast
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                      alignItems: isFirst
                        ? "flex-start"
                        : isLast
                          ? "flex-end"
                          : "center",
                    }}
                  >
                    <div className="text-[10px] text-neutral-500 mt-0.5 font-mono whitespace-nowrap">
                      {formatNumber(boundary)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Handle gradient colors (default)
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

      return (
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
      // Filter to only show categories that actually appear in the data
      const categoriesInData = new Set(
        areaStats?.stats
          .map((stat) => String(stat.primary))
          .filter((v) => v && v !== "null" && v !== "undefined"),
      );

      return (
        <div className="flex flex-col gap-1.5 w-full py-1">
          {Object.keys(colorScheme.colorMap)
            .filter((key) => categoriesInData.has(key))
            .toSorted((a, b) => {
              if (areaStats?.primary?.columnType === ColumnType.Number) {
                return Number(a) < Number(b) ? -1 : 1;
              }
              return a < b ? -1 : 1;
            })
            .map((key) => (
              <div className="flex items-center gap-2 text-xs" key={key}>
                <div
                  className="w-3 h-3 flex-shrink-0 border border-neutral-300"
                  style={{ backgroundColor: colorScheme.colorMap[key] }}
                />
                <span>{key}</span>
              </div>
            ))}
          <div className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 flex-shrink-0 border border-neutral-300"
              style={{ backgroundColor: colorScheme.colorMap.__default }}
            />
            <span>Other</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="group flex flex-col gap-1 rounded-sm overflow-auto bg-white border border-neutral-200 w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setBoundariesPanelOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setBoundariesPanelOpen(true);
          }
        }}
        className="flex items-start justify-between hover:bg-neutral-50 transition-colors cursor-pointer text-left w-full"
      >
        <div className="flex flex-col flex-1 py-1">
          <div className="flex items-center justify-between pr-2">
            <div className="flex gap-x-1 pb-2 px-2 items-center text-sm flex-wrap">
              <p className="flex items-center font-medium">
                {dataSource?.name}
              </p>
              <ChevronRight className="w-4 h-4" />
              <p className="flex items-center gap-0.5">{getColumnLabel()}</p>
            </div>
            <VisibilityToggle
              isLayerVisible={isLayerVisible}
              toggleLayerVisibility={toggleLayerVisibility}
            />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center px-2 py-4">
              <LoaderPinwheel className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : isBivariate ? (
            <div className="px-2" onClick={(e) => e.stopPropagation()}>
              <BivariateLegend />
            </div>
          ) : hasColumn && colorScheme ? (
            <div className="flex px-2">{makeBars()}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const VisibilityToggle = ({
  isLayerVisible,
  toggleLayerVisibility,
}: {
  isLayerVisible: boolean;
  toggleLayerVisibility: () => void;
}) => (
  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
    <div
      role="button"
      tabIndex={0}
      className="p-2 rounded bg-neutral-100 hover:bg-neutral-200 cursor-pointer transition-colors"
      aria-label={isLayerVisible ? "Hide layer" : "Show layer"}
      onClick={(e) => {
        e.stopPropagation();
        toggleLayerVisibility();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          toggleLayerVisibility();
        }
      }}
    >
      {isLayerVisible ? <Eye size={16} /> : <EyeOff size={16} />}
    </div>
  </div>
);
