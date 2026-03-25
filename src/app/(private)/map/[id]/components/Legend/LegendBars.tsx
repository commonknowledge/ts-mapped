import { ColumnType } from "@/models/DataSource";
import { ColorScaleType } from "@/models/MapView";
import { cn } from "@/shadcn/utils";
import { resolveColumnMetadataEntry } from "@/utils/resolveColumnMetadata";
import { formatNumber } from "@/utils/text";
import { calculateStepColor } from "../../colors";
import { getChoroplethDataKey } from "../Choropleth/utils";
import type { CategoricColorScheme, NumericColorScheme } from "../../colors";
import type { CombinedAreaStats } from "../../data";
import type { MapViewConfig } from "@/models/MapView";
import type { RouterOutputs } from "@/services/trpc/react";

type DataSource =
  | RouterOutputs["dataSource"]["listReadable"][number]
  | null
  | undefined;

interface SteppedBarsProps {
  colorScheme: NumericColorScheme;
  steppedColorSteps: { start: number; end: number }[];
  viewConfig: MapViewConfig;
}

export function SteppedBars({
  colorScheme,
  steppedColorSteps,
  viewConfig,
}: SteppedBarsProps) {
  const sortedSteps = [...steppedColorSteps].sort((a, b) => a.start - b.start);
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

interface GradientBarsProps {
  colorScheme: NumericColorScheme;
  viewConfig: MapViewConfig;
  dataSource: DataSource;
}

export function GradientBars({
  colorScheme,
  viewConfig,
  dataSource,
}: GradientBarsProps) {
  const numStops = 24;
  const stops = new Array(numStops + 1)
    .fill(null)
    .map((_, i) => {
      const t = i / numStops;
      const value =
        colorScheme.minValue + t * (colorScheme.maxValue - colorScheme.minValue);
      const color = colorScheme.colorScale(value);
      return `${color} ${t * 100}%`;
    })
    .join(", ");

  let numTicks = 5 as number; // number of numeric step labels
  let denom = Math.max(numTicks - 1, 1);
  let values = Array.from({ length: numTicks }).map((_, i) => {
    const t = i / denom;
    return colorScheme.minValue + t * (colorScheme.maxValue - colorScheme.minValue);
  });

  const valueLabels =
    resolveColumnMetadataEntry(
      dataSource?.columnMetadata ?? [],
      dataSource?.organisationOverride?.columnMetadata,
      viewConfig.areaDataColumn,
    )?.valueLabels || {};

  const hasValueLabels = Object.keys(valueLabels).length > 0;

  if (hasValueLabels) {
    const numericKeys = Object.keys(valueLabels)
      .filter((key) => key !== "")
      .map((key) => Number(key))
      .filter(
        (v) =>
          Number.isFinite(v) &&
          v >= colorScheme.minValue &&
          v <= colorScheme.maxValue,
      )
      .toSorted((a, b) => a - b);
    if (numericKeys.length) {
      values = numericKeys;
      numTicks = values.length;
      denom = Math.max(numTicks - 1, 1);
    }
  }

  return (
    <div className="w-full">
      <div
        className="w-full h-4 border border-neutral-200"
        style={{ background: `linear-gradient(to right, ${stops})` }}
      />
      <div className={cn("relative mt-1", hasValueLabels ? "h-10" : "h-6")}>
        {Array.from({ length: numTicks }).map((_, i) => {
          const t = i / denom;
          const value = values[i];
          const positionStyle =
            i === 0
              ? {
                  left: 0,
                  transform: "translateX(0%)",
                  width: `${100 / (denom + 1)}%`,
                }
              : i === numTicks - 1
                ? {
                    left: "100%",
                    transform: "translateX(-100%)",
                    width: `${100 / (denom + 1)}%`,
                  }
                : {
                    left: `${t * 100}%`,
                    transform: "translateX(-50%)",
                    width: `${100 / (denom + 1)}%`,
                  };
          const alignClass =
            i === 0
              ? "items-start"
              : i === numTicks - 1
                ? "items-end text-right"
                : "items-center text-center";
          return (
            <div
              key={i}
              className={`absolute flex flex-col ${alignClass}`}
              style={positionStyle}
            >
              <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                {(() => {
                  if (hasValueLabels) {
                    if (value) {
                      return valueLabels[String(value)];
                    } else {
                      // Handle empty values
                      return valueLabels[String(value)] || valueLabels[""];
                    }
                  }
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
}

interface CategoricBarsProps {
  colorScheme: CategoricColorScheme;
  areaStats: CombinedAreaStats | null | undefined;
  dataSource: DataSource;
  viewConfig: MapViewConfig;
}

export function CategoricBars({
  colorScheme,
  areaStats,
  dataSource,
  viewConfig,
}: CategoricBarsProps) {
  const categoriesInData = new Set(
    areaStats?.stats
      .map((stat) => String(stat.primary))
      .filter((v) => v && v !== "null" && v !== "undefined"),
  );

  const valueLabels =
    resolveColumnMetadataEntry(
      dataSource?.columnMetadata ?? [],
      dataSource?.organisationOverride?.columnMetadata,
      viewConfig.areaDataColumn,
    )?.valueLabels || {};

  return (
    <div className="flex max-h-[min(35vh,14rem)] min-h-0 w-full flex-col gap-1.5 overflow-y-auto py-1 pr-0.5">
      {Object.keys(colorScheme.colorMap)
        .filter((key) => categoriesInData.has(key))
        .toSorted((a, b) => {
          if (areaStats?.primary?.columnType === ColumnType.Number) {
            return Number(a) < Number(b) ? -1 : 1;
          }
          return a < b ? -1 : 1;
        })
        .map((key) => {
          let label = valueLabels[key];
          if (
            !label &&
            areaStats?.primary?.columnType === ColumnType.Number &&
            Number(key) === 0
          ) {
            label = valueLabels[""];
          }
          return (
            <div className="flex items-center gap-2 text-xs" key={key}>
              <div
                className="w-3 h-3 flex-shrink-0 border border-neutral-300"
                style={{ backgroundColor: colorScheme.colorMap[key] }}
              />
              <span>{label || key}</span>
            </div>
          );
        })}
    </div>
  );
}

interface LegendBarsProps {
  colorScheme: CategoricColorScheme | NumericColorScheme;
  viewConfig: MapViewConfig;
  areaStats: CombinedAreaStats | null | undefined;
  dataSource: DataSource;
}

export function LegendBars({
  colorScheme,
  viewConfig,
  areaStats,
  dataSource,
}: LegendBarsProps) {
  if (colorScheme.colorSchemeType === "numeric") {
    const steppedColorSteps =
      viewConfig.steppedColorStepsByKey?.[getChoroplethDataKey(viewConfig)];
    if (
      viewConfig.colorScaleType === ColorScaleType.Stepped &&
      steppedColorSteps &&
      steppedColorSteps.length > 0
    ) {
      return (
        <SteppedBars
          colorScheme={colorScheme}
          steppedColorSteps={steppedColorSteps}
          viewConfig={viewConfig}
        />
      );
    }

    return (
      <GradientBars
        colorScheme={colorScheme}
        viewConfig={viewConfig}
        dataSource={dataSource}
      />
    );
  }

  return (
    <CategoricBars
      colorScheme={colorScheme}
      areaStats={areaStats}
      dataSource={dataSource}
      viewConfig={viewConfig}
    />
  );
}
