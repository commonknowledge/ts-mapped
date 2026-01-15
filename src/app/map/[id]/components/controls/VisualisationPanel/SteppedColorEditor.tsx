import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getInterpolator } from "@/app/map/[id]/colors";
import { useAreaStats } from "@/app/map/[id]/data";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { ColumnType } from "@/server/models/DataSource";
import {
  ColorScaleType,
  ColorScheme,
  type SteppedColorStep,
} from "@/server/models/MapView";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";

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
    <div ref={sliderRef} className={`relative  ${className}`}>
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

export default function SteppedColorEditor() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  const [isOpen, setIsOpen] = useState(false);

  const minValue = areaStats?.primary?.minValue ?? 0;
  const maxValue = areaStats?.primary?.maxValue ?? 100;
  const colorScheme = viewConfig.colorScheme || ColorScheme.RedBlue;
  const isReversed = Boolean(viewConfig.reverseColorScheme);

  // Track previous color scheme to detect changes
  const prevColorSchemeRef = useRef<{
    colorScheme: ColorScheme;
    isReversed: boolean;
  }>({ colorScheme, isReversed });

  // Get step ranges (without colors) from config or defaults
  const stepRanges = useMemo(() => {
    if (
      viewConfig.steppedColorSteps &&
      viewConfig.steppedColorSteps.length > 0
    ) {
      const ranges = viewConfig.steppedColorSteps.map((s) => ({
        start: s.start,
        end: s.end,
      }));

      // Ensure boundaries are connected
      for (let i = 0; i < ranges.length - 1; i++) {
        ranges[i].end = ranges[i + 1].start;
      }

      // Ensure first starts at minValue and last ends at maxValue
      if (ranges.length > 0) {
        ranges[0].start = minValue;
        ranges[ranges.length - 1].end = maxValue;
      }

      return ranges;
    }
    // Default: 3 steps evenly distributed
    const stepSize = (maxValue - minValue) / 3;
    return [
      { start: minValue, end: minValue + stepSize },
      { start: minValue + stepSize, end: minValue + stepSize * 2 },
      { start: minValue + stepSize * 2, end: maxValue },
    ];
  }, [viewConfig.steppedColorSteps, minValue, maxValue]);

  // Calculate steps with colors from gradient
  const steps = useMemo(() => {
    const interpolator = getInterpolator(colorScheme, viewConfig.customColor);

    return stepRanges.map((rangeItem, index) => {
      const numSteps = stepRanges.length;
      const gradientPosition = numSteps > 1 ? index / (numSteps - 1) : 0;

      const t = isReversed ? 1 - gradientPosition : gradientPosition;
      const clampedT = Math.max(0, Math.min(1, t));

      const color = interpolator(clampedT);

      return {
        start: rangeItem.start,
        end: rangeItem.end,
        color: color || "#cccccc",
      };
    });
  }, [stepRanges, colorScheme, isReversed, viewConfig.customColor]);

  // Update colors when color scheme, reverse, or custom color changes
  useEffect(() => {
    const prev = prevColorSchemeRef.current;
    const schemeChanged =
      prev.colorScheme !== colorScheme || prev.isReversed !== isReversed;

    if (
      (schemeChanged || colorScheme === ColorScheme.Custom) &&
      stepRanges.length > 0 &&
      viewConfig.steppedColorSteps &&
      viewConfig.steppedColorSteps.length > 0
    ) {
      prevColorSchemeRef.current = { colorScheme, isReversed };
      const interpolator = getInterpolator(colorScheme, viewConfig.customColor);
      const numSteps = stepRanges.length;
      const updatedSteps = stepRanges.map((range, index) => {
        const gradientPosition = numSteps > 1 ? index / (numSteps - 1) : 0;
        const t = isReversed ? 1 - gradientPosition : gradientPosition;
        const clampedT = Math.max(0, Math.min(1, t));
        return {
          start: range.start,
          end: range.end,
          color: interpolator(clampedT) || "#cccccc",
        };
      });
      updateViewConfig({ steppedColorSteps: updatedSteps });
    }
  }, [
    colorScheme,
    isReversed,
    stepRanges,
    viewConfig.steppedColorSteps,
    viewConfig.customColor,
    updateViewConfig,
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
    const newSteps = [...steps];

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

    // Recalculate colors
    const interpolator = getInterpolator(colorScheme, viewConfig.customColor);
    const numSteps = newSteps.length;
    newSteps.forEach((step, i) => {
      const gradientPosition = numSteps > 1 ? i / (numSteps - 1) : 0;
      const t = isReversed ? 1 - gradientPosition : gradientPosition;
      const clampedT = Math.max(0, Math.min(1, t));
      step.color = interpolator(clampedT) || "#cccccc";
    });

    updateViewConfig({ steppedColorSteps: newSteps });
  };

  const handleAddStep = () => {
    const lastStep = steps[steps.length - 1];
    const midpoint = lastStep
      ? (lastStep.start + lastStep.end) / 2
      : (minValue + maxValue) / 2;

    const newSteps = [...steps];
    newSteps[newSteps.length - 1].end = midpoint;

    const newStep: SteppedColorStep = {
      start: midpoint,
      end: maxValue,
      color: "#cccccc",
    };
    newSteps.push(newStep);

    // Recalculate colors
    const interpolator = getInterpolator(colorScheme, viewConfig.customColor);
    const numSteps = newSteps.length;
    newSteps.forEach((step, i) => {
      const gradientPosition = numSteps > 1 ? i / (numSteps - 1) : 0;
      const t = isReversed ? 1 - gradientPosition : gradientPosition;
      const clampedT = Math.max(0, Math.min(1, t));
      step.color = interpolator(clampedT) || "#cccccc";
    });

    updateViewConfig({ steppedColorSteps: newSteps });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);

    if (index > 0 && newSteps.length > 0) {
      newSteps[index - 1].end = steps[index].end;
    }
    if (index < steps.length - 1 && newSteps.length > 0) {
      const nextIndex = index < newSteps.length ? index : newSteps.length - 1;
      if (nextIndex < newSteps.length) {
        newSteps[nextIndex].start = steps[index].start;
      }
    }

    // Recalculate colors
    const interpolator = getInterpolator(colorScheme, viewConfig.customColor);
    const numSteps = newSteps.length;
    newSteps.forEach((step, i) => {
      const gradientPosition = numSteps > 1 ? i / (numSteps - 1) : 0;
      const t = isReversed ? 1 - gradientPosition : gradientPosition;
      const clampedT = Math.max(0, Math.min(1, t));
      step.color = interpolator(clampedT) || "#cccccc";
    });

    updateViewConfig({
      steppedColorSteps: newSteps.length > 0 ? newSteps : undefined,
    });
  };

  const handleReset = () => {
    updateViewConfig({ steppedColorSteps: undefined });
  };

  const stepSize = (maxValue - minValue) / 1000;

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
              Value range: {minValue.toFixed(2)} to {maxValue.toFixed(2)}
            </p>
            <p className="text-xs">
              Colors are automatically calculated from the selected color scheme
              gradient.
            </p>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isFirst = index === 0;
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md border border-neutral-200 bg-neutral-50"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        <div
                          className="w-6 h-6 rounded border border-neutral-300 flex-shrink-0"
                          style={{ backgroundColor: step.color }}
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
                              ? minValue.toFixed(2)
                              : step.start.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isLast ? maxValue.toFixed(2) : step.end.toFixed(2)}
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
                          color={step.color}
                          isFirst={isFirst}
                          isLast={isLast}
                          className=""
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Range: {step.start.toFixed(2)} - {step.end.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {steps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
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
            {viewConfig.steppedColorSteps && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
