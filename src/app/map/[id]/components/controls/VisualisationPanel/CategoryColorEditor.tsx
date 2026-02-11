import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCategoryColorsKey, useColorScheme } from "@/app/map/[id]/colors";
import { useAreaStats } from "@/app/map/[id]/data";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { ColumnType } from "@/server/models/DataSource";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";

export default function CategoryColorEditor() {
  const { viewConfig, updateViewConfig } = useMapViews();
  const areaStatsQuery = useAreaStats();
  const areaStats = areaStatsQuery?.data;
  const [isOpen, setIsOpen] = useState(false);

  const colorScheme = useColorScheme({
    areaStats,
    viewConfig,
  });

  // Debounce timer ref
  const debounceTimers = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Get unique categories from areaStats
  const categories = useMemo(() => {
    if (
      !areaStats ||
      !colorScheme ||
      colorScheme.colorSchemeType === "numeric"
    ) {
      return [];
    }
    return Object.keys(colorScheme.colorMap).toSorted((a, b) => {
      if (areaStats?.primary?.columnType === ColumnType.Number) {
        const numA = Number(a);
        const numB = Number(b);
        if (isNaN(numA) || isNaN(numB)) {
          return a.localeCompare(b);
        }
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [areaStats, colorScheme]);

  const handleColorChange = useCallback(
    (category: string, color: string) => {
      const categoryColorsKey = getCategoryColorsKey(
        areaStats?.dataSourceId,
        areaStats?.primary?.column,
        category,
      );
      const currentColors = viewConfig.categoryColors || {};
      // Set both [category] and [key], to set the default value for this category
      updateViewConfig({
        categoryColors: {
          ...currentColors,
          [category]: color,
          [categoryColorsKey]: color,
        },
      });
    },
    [
      areaStats?.dataSourceId,
      areaStats?.primary?.column,
      updateViewConfig,
      viewConfig.categoryColors,
    ],
  );

  const handleColorChangeDebounced = useCallback(
    (category: string, color: string) => {
      // Clear existing timer for this category
      if (debounceTimers.current[category]) {
        clearTimeout(debounceTimers.current[category]);
      }

      // Set new timer
      debounceTimers.current[category] = setTimeout(() => {
        handleColorChange(category, color);
        debounceTimers.current[category] = null;
      }, 300);
    },
    [handleColorChange],
  );

  // Cleanup effect to clear all pending timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const handleResetColors = (categories: string[]) => {
    // Clear any pending debounced update for this category
    const currentColors = viewConfig.categoryColors || {};
    let nextColors = { ...currentColors };
    for (const category of categories) {
      if (debounceTimers.current[category]) {
        clearTimeout(debounceTimers.current[category]);
        debounceTimers.current[category] = null;
      }

      const categoryColorsKey = getCategoryColorsKey(
        areaStats?.dataSourceId,
        areaStats?.primary?.column,
        category,
      );
      nextColors = Object.fromEntries(
        Object.entries(nextColors).filter(
          ([key]) => key !== category && key !== categoryColorsKey,
        ),
      );
    }
    updateViewConfig({
      categoryColors:
        Object.keys(nextColors).length > 0 ? nextColors : undefined,
    });
  };

  if (
    !colorScheme ||
    colorScheme.colorSchemeType === "numeric" ||
    categories.length === 0
  ) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          Set category colors
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set category colors</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {categories.map((category) => {
            const currentColor =
              viewConfig.categoryColors?.[category] ||
              colorScheme.colorMap[category];
            const categoryColorsKey = getCategoryColorsKey(
              areaStats?.dataSourceId,
              areaStats?.primary?.column,
              category,
            );
            const isSet =
              viewConfig.categoryColors?.[category] ||
              viewConfig.categoryColors?.[categoryColorsKey];
            return (
              <div
                key={category}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                    <div
                      className="w-6 h-6 rounded border border-neutral-300 flex-shrink-0 relative"
                      style={{ backgroundColor: currentColor }}
                    >
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) =>
                          handleColorChangeDebounced(category, e.target.value)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title={`Change color for ${category}`}
                      />
                    </div>
                    <span className="text-sm font-normal truncate flex-1">
                      {category === "__default" ? "Other" : category}
                    </span>
                  </label>
                </div>
                {isSet && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleResetColors([category])}
                    title="Reset to default color"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
          {Object.keys(viewConfig.categoryColors || {}).length > 0 && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleResetColors(categories)}
              >
                Reset all colors
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
