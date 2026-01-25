import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateStepColor } from "@/app/map/[id]/colors";
import { useAreaStats } from "@/app/map/[id]/data";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { ColumnType } from "@/server/models/DataSource";
import { ColorScaleType, type SteppedColorStep } from "@/server/models/MapView";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { getChoroplethDataKey } from "../../Choropleth/utils";

// Custom multi-handle range slider
function RangeSlider({
  min,
  max,
  values,
  onChange,
  step,
  color,
  isFirst,
  isLast,
  className,
}: {
  min: number;
  max: number;
  values: [number, number?];
  onChange: (values: [number, number?]) => void;
  step: number;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  className?: string;
}) {
  const [minVal, maxVal] = values;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<"min" | "max" | null>(null);

  const getPercentage = useCallback(
    (value: number) => ((value - min) / (max - min)) * 100,
    [min, max],
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return min;
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const value = min + percentage * (max - min);
      return Math.round(value / step) * step;
    },
    [min, max, step],
  );

  const handleMouseDown = useCallback((handle: "min" | "max") => {
    setActiveHandle(handle);
  }, []);

  useEffect(() => {
    if (!activeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromPosition(e.clientX);

      if (activeHandle === "min") {
        const clampedMin = Math.max(
          min,
          Math.min(maxVal !== undefined ? maxVal - step : max, newValue),
        );
        onChange([clampedMin, maxVal]);
      } else if (activeHandle === "max" && maxVal !== undefined) {
        const clampedMax = Math.max(minVal + step, Math.min(max, newValue));
        onChange([minVal, clampedMax]);
      }
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    activeHandle,
    min,
    max,
    minVal,
    maxVal,
    step,
    onChange,
    getValueFromPosition,
  ]);

  const minPercent = getPercentage(minVal);
  const maxPercent = maxVal !== undefined ? getPercentage(maxVal) : 100;

  return (
    <div ref={sliderRef} className={`relative ${className}`}>
      {/* Background track */}
      <div className="absolute w-full h-2 bg-neutral-200 rounded-lg" />

      {/* Active range */}
      <div
        className={`absolute h-2 border border-neutral-400 ${isFirst ? "rounded-l-lg" : isLast ? "rounded-r-lg" : "rounded-lg"}`}
        style={{
          left: `${isFirst ? 0 : minPercent}%`,
          width: `${isFirst ? maxPercent : isLast ? 100 - minPercent : maxPercent - minPercent}%`,
          backgroundColor: color,
        }}
      />

      {/* Min handle (only if not first step) */}
      {!isFirst && (
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-pointer z-20 transform -translate-x-1/2 -translate-y-1"
          style={{ left: `${minPercent}%`, top: "50%" }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleMouseDown("min");
          }}
        />
      )}

      {/* Max handle (only if not last step) */}
      {!isLast && (
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-pointer z-20 transform -translate-x-1/2 -translate-y-1"
          style={{ left: `${maxPercent}%`, top: "50%" }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleMouseDown("max");
          }}
        />
      )}
    </div>
  );
}

// Helper function to create default steps
function createDefaultSteps(
  minValue: number,
  maxValue: number,
): SteppedColorStep[] {
  const stepSize = (maxValue - minValue) / 3;
  const ranges = [
    { start: minValue, end: minValue + stepSize },
    { start: minValue + stepSize, end: minValue + stepSize * 2 },
    { start: minValue + stepSize * 2, end: maxValue },
  ];

  return ranges.map((range) => ({
    start: range.start,
    end: range.end,
  }));
}

export default function SteppedColorEditor() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const choroplethDataKey = getChoroplethDataKey(viewConfig);
  const savedSteppedColorSteps =
    viewConfig.steppedColorStepsByKey?.[choroplethDataKey];
  const { data: areaStats } = useAreaStats();
  const [isOpen, setIsOpen] = useState(false);
  const areaStatsDataKey = getChoroplethDataKey({
    calculationType: areaStats?.calculationType,
    areaDataSourceId: areaStats?.dataSourceId || "",
    areaDataColumn: areaStats?.primary?.column || "",
    areaDataSecondaryColumn: areaStats?.secondary?.column,
  });

  const minValue = areaStats?.primary?.minValue ?? 0;
  const maxValue = areaStats?.primary?.maxValue ?? 0;
  const hasValidRange = maxValue > minValue;

  // Compute default steps
  const defaultSteps = useMemo(() => {
    if (!hasValidRange) {
      return [];
    }
    return createDefaultSteps(minValue, maxValue);
  }, [hasValidRange, maxValue, minValue]);

  const [localSteps, setLocalSteps] = useState<SteppedColorStep[]>(
    savedSteppedColorSteps || [],
  );

  // Initial setup
  useEffect(() => {
    if (
      !savedSteppedColorSteps?.length &&
      choroplethDataKey === areaStatsDataKey
    ) {
      setLocalSteps(defaultSteps);
      updateViewConfig({
        steppedColorStepsByKey: {
          ...viewConfig.steppedColorStepsByKey,
          [choroplethDataKey]: defaultSteps,
        },
      });
    }
  }, [
    areaStatsDataKey,
    choroplethDataKey,
    defaultSteps,
    savedSteppedColorSteps?.length,
    updateViewConfig,
    viewConfig.steppedColorStepsByKey,
  ]);

  if (
    !areaStats ||
    areaStats.primary?.columnType !== ColumnType.Number ||
    viewConfig.colorScaleType !== ColorScaleType.Stepped
  ) {
    return null;
  }

  const handleStepChange = (
    index: number,
    newStart: number,
    newEnd?: number,
  ) => {
    const newSteps = [...localSteps];

    // Update current step
    newSteps[index].start = newStart;
    if (newEnd !== undefined) {
      newSteps[index].end = newEnd;
    }

    // Connect boundaries: end of step N = start of step N+1
    if (index < newSteps.length - 1) {
      newSteps[index + 1].start = newSteps[index].end;
    }
    if (index > 0) {
      newSteps[index - 1].end = newSteps[index].start;
    }

    setLocalSteps(newSteps);
  };

  const handleAddStep = () => {
    const lastStep = localSteps[localSteps.length - 1];
    const midpoint = lastStep
      ? (lastStep.start + lastStep.end) / 2
      : (minValue + maxValue) / 2;

    const newSteps = [...localSteps];
    newSteps[newSteps.length - 1].end = midpoint;

    const newStep: SteppedColorStep = {
      start: midpoint,
      end: maxValue,
    };
    newSteps.push(newStep);

    setLocalSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = localSteps.filter((_, i) => i !== index);

    if (index > 0 && newSteps.length > 0) {
      newSteps[index - 1].end = localSteps[index].end;
    }
    if (index < localSteps.length - 1 && newSteps.length > 0) {
      const nextIndex = index < newSteps.length ? index : newSteps.length - 1;
      if (nextIndex < newSteps.length) {
        newSteps[nextIndex].start = localSteps[index].start;
      }
    }

    setLocalSteps(newSteps);
  };

  const handleReset = () => {
    const steps = savedSteppedColorSteps || defaultSteps;
    setLocalSteps([...steps]);
  };

  const handleApply = () => {
    // Ensure boundaries are connected before applying
    const stepsToApply = [...localSteps];

    // Connect boundaries: end of step N = start of step N+1
    for (let i = 0; i < stepsToApply.length - 1; i++) {
      stepsToApply[i].end = stepsToApply[i + 1].start;
    }

    // Ensure first starts at minValue and last ends at maxValue
    if (stepsToApply.length > 0) {
      stepsToApply[0].start = minValue;
      stepsToApply[stepsToApply.length - 1].end = maxValue;
    }

    updateViewConfig({
      steppedColorStepsByKey: {
        ...viewConfig.steppedColorStepsByKey,
        [choroplethDataKey]: stepsToApply,
      },
    });
    setIsOpen(false);
  };

  const stepSize = (maxValue - minValue) / 1000;
  const range = maxValue - minValue;
  const showDecimals = range <= 10;
  const formatValue = (value: number) =>
    showDecimals ? value.toFixed(2) : Math.round(value).toString();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          Configure color steps
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure color steps</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Value range: {formatValue(minValue)} to {formatValue(maxValue)}
            </p>
            <p className="text-xs">
              Colors are automatically calculated from the selected color scheme
              gradient.
            </p>
          </div>
          <div className="space-y-4">
            {localSteps.map((step, index) => {
              const isFirst = index === 0;
              const isLast = index === localSteps.length - 1;
              const stepColor = calculateStepColor(
                index,
                localSteps.length,
                viewConfig,
              );

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md border border-neutral-200 bg-neutral-50"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        <div
                          className="w-6 h-6 rounded border border-neutral-300 shrink-0"
                          style={{ backgroundColor: stepColor }}
                          title={`Step ${index + 1} color`}
                        />
                        <span className="text-xs font-medium">
                          Step {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {isFirst
                              ? formatValue(minValue)
                              : formatValue(step.start)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isLast
                              ? formatValue(maxValue)
                              : formatValue(step.end)}
                          </span>
                        </div>

                        <RangeSlider
                          min={minValue}
                          max={maxValue}
                          values={
                            isFirst
                              ? [minValue, step.end]
                              : isLast
                                ? [step.start, undefined]
                                : [step.start, step.end]
                          }
                          onChange={([newStart, newEnd]) => {
                            if (isFirst) {
                              handleStepChange(index, minValue, newEnd);
                            } else if (isLast) {
                              handleStepChange(index, newStart, maxValue);
                            } else {
                              handleStepChange(index, newStart, newEnd);
                            }
                          }}
                          step={stepSize}
                          color={stepColor}
                          isFirst={isFirst}
                          isLast={isLast}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Range: {formatValue(step.start)} -{" "}
                        {formatValue(step.end)}
                      </span>
                    </div>
                  </div>
                  {localSteps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveStep(index)}
                      title="Remove step"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAddStep}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add step
            </Button>
            {localSteps && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="default" className="flex-1" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
