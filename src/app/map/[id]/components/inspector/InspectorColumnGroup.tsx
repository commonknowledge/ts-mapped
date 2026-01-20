"use client";

import { ChevronDown, Folder, Palette, Settings } from "lucide-react";
import { useState, useMemo } from "react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { cn } from "@/shadcn/utils";
import type { ColumnDef } from "@/server/models/DataSource";
import { ColumnType } from "@/server/models/DataSource";
import { formatNumber } from "@/utils/text";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import GroupSettingsDialog, { type GroupSettings } from "./GroupSettingsDialog";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shadcn/ui/chart";

interface InspectorColumnGroupProps {
  groupId: string;
  groupName: string;
  columns: ColumnDef[];
  dataRecord: { json: Record<string, unknown> } | null | undefined;
  visualizedColumnName: string | null;
  dataSourceId: string;
  settings?: GroupSettings;
  onVisualise: (columnName: string) => void;
}

export default function InspectorColumnGroup({
  groupId,
  groupName,
  columns,
  dataRecord,
  visualizedColumnName,
  dataSourceId,
  settings,
  onVisualise,
}: InspectorColumnGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const { mapConfig, updateMapConfig } = useMapConfig();

  const getColumnTypeLabel = (type: ColumnType) => {
    switch (type) {
      case ColumnType.String:
        return "String";
      case ColumnType.Number:
        return "Number";
      case ColumnType.Date:
        return "Date";
      case ColumnType.Boolean:
        return "Boolean";
      default:
        return "Unknown";
    }
  };

  const getColumnValue = (column: ColumnDef) => {
    if (!dataRecord?.json || !(column.name in dataRecord.json)) {
      return null;
    }

    const rawValue = dataRecord.json[column.name];
    
    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    if (column.type === ColumnType.Number) {
      const numValue = Number(rawValue);
      if (isNaN(numValue)) {
        return String(rawValue);
      }
      return numValue;
    }

    if (column.type === ColumnType.Boolean) {
      return Boolean(rawValue);
    }

    return String(rawValue);
  };

  // Get all numeric values in the group for scaling progress bars
  const getAllNumericValues = useMemo(() => {
    if (!dataRecord?.json) return [];
    const values: number[] = [];
    columns.forEach((column) => {
      if (column.type === ColumnType.Number && column.name in dataRecord.json) {
        const rawValue = dataRecord.json[column.name];
        if (rawValue !== null && rawValue !== undefined) {
          const numValue = Number(rawValue);
          if (!isNaN(numValue)) {
            values.push(numValue);
          }
        }
      }
    });
    return values;
  }, [columns, dataRecord]);

  // Get min and max values for scaling progress bars
  const { minValue, maxValue } = useMemo(() => {
    if (getAllNumericValues.length === 0) {
      return { minValue: 0, maxValue: 100 };
    }
    const min = Math.min(...getAllNumericValues);
    const max = Math.max(...getAllNumericValues);
    return { minValue: min, maxValue: max };
  }, [getAllNumericValues]);

  const shouldShowAsPercentage = (column: ColumnDef, value: number | string | boolean | null) => {
    // Only show as percentage if explicitly enabled in settings
    // Default behavior: show actual values (0.5, 0.8, etc.) not percentages
    if (!settings?.isPercentage) {
      return false;
    }
    // If setting is enabled, check if value is numeric
    return column.type === ColumnType.Number && typeof value === "number" && !isNaN(value);
  };

  const getScaledValue = (value: number): number => {
    if (!settings?.isScale || typeof value !== "number" || isNaN(value)) {
      return value;
    }
    const lower = settings.lowerBound ?? 0;
    const upper = settings.upperBound ?? 100;
    if (upper === lower) return 0;
    // Normalize value to 0-1 range based on bounds
    const normalized = (value - lower) / (upper - lower);
    return Math.max(0, Math.min(1, normalized));
  };

  const handleSaveSettings = (newSettings: GroupSettings) => {
    const currentGroups = mapConfig.columnGroups?.[dataSourceId];
    if (!currentGroups) return;

    const updatedGroups = currentGroups.groups.map(group =>
      group.id === groupId ? { ...group, settings: newSettings } : group
    );

    updateMapConfig({
      columnGroups: {
        ...(mapConfig.columnGroups || {}),
        [dataSourceId]: {
          ...currentGroups,
          groups: updatedGroups,
        },
      },
    });
  };

  // Prepare chart data for bar chart visualization - show ACTUAL values, not normalized
  const chartData = useMemo(() => {
    if (!settings?.showAsBarChart || !dataRecord?.json) return null;

    const numericColumns = columns.filter(
      (col) => col.type === ColumnType.Number
    );

    if (numericColumns.length === 0) return null;

    const data: Array<{ name: string; value: number }> = [];
    
    numericColumns.forEach((column) => {
      if (!dataRecord?.json || !(column.name in dataRecord.json)) return;
      
      const rawValue = dataRecord.json[column.name];
      if (rawValue === null || rawValue === undefined) return;
      
      const numValue = Number(rawValue);
      if (isNaN(numValue)) return;

      // Show actual raw values in the chart (1, 2, etc.)
      // Only apply percentage conversion if explicitly enabled in settings
      let displayValue = numValue;
      if (settings?.isPercentage) {
        displayValue = numValue * 100;
      }
      // Don't auto-detect percentages - only use explicit setting

      data.push({
        name: column.name,
        value: displayValue, // Actual value, not normalized
      });
    });

    return data.length > 0 ? data : null;
  }, [columns, dataRecord, settings]);

  // Color palette for bars
  const barColors = [
    "#2563eb", // Blue
    "#16a34a", // Green
    "#dc2626", // Red
    "#ca8a04", // Yellow/Amber
    "#9333ea", // Purple
    "#ea580c", // Orange
    "#0891b2", // Cyan
    "#be123c", // Rose
    "#059669", // Emerald
    "#7c3aed", // Violet
  ];

  // Create chart config for bar chart with individual colors for each column
  const chartConfig = useMemo(() => {
    if (!chartData) return {};
    const config: Record<string, { label: string; color: string }> = {};
    
    chartData.forEach((item, index) => {
      const color = barColors[index % barColors.length];
      config[item.name] = {
        label: item.name,
        color: color,
      };
    });
    
    return config;
  }, [chartData]);

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-50 transition-colors">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          <ChevronDown
            size={12}
            className={cn(
              "text-neutral-400 transition-transform flex-shrink-0",
              isExpanded && "rotate-180"
            )}
          />
          <Folder size={12} className="text-neutral-400 flex-shrink-0" />
          <span className="text-xs font-medium text-neutral-700 truncate">
            {groupName}
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {columns.length}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSettingsDialogOpen(true);
          }}
          className="p-1 hover:bg-neutral-200 rounded transition-colors flex-shrink-0"
          title="Edit group settings"
        >
          <Settings size={12} className="text-neutral-400" />
        </button>
      </div>
      {isExpanded && (
        <div className="ml-4 mt-0.5 space-y-2">
          {/* Show bar chart if enabled */}
          {settings?.showAsBarChart && chartData && chartData.length > 0 && (
            <div className="mb-4 p-2 bg-neutral-50 rounded">
              <ChartContainer
                config={chartConfig}
                className="h-[200px] w-full"
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 40, right: 12, top: 12, bottom: 12 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.map((entry, index) => {
                      const color = barColors[index % barColors.length];
                      return (
                        <Cell
                          key={`cell-${entry.name}-${index}`}
                          fill={color}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}
          {columns.map((column) => {
            const isVisualized = column.name === visualizedColumnName;
            const rawValue = getColumnValue(column);
            
            // Only process numeric values
            if (column.type !== ColumnType.Number || typeof rawValue !== "number" || isNaN(rawValue)) {
              const displayValue = rawValue !== null
                ? column.type === ColumnType.Boolean
                  ? String(rawValue)
                  : String(rawValue)
                : null;
              
              return (
                <ContextMenu key={column.name}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        "flex flex-col gap-1 p-2 rounded cursor-pointer transition-colors",
                        isVisualized
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-neutral-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <dt
                          className={cn(
                            "text-xs uppercase font-mono flex items-center gap-1",
                            isVisualized
                              ? "text-blue-700"
                              : "text-muted-foreground"
                          )}
                        >
                          {column.name}
                          {isVisualized && (
                            <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
                              Visualised
                            </span>
                          )}
                        </dt>
                        <span
                          className={cn(
                            "text-[10px]",
                            isVisualized
                              ? "text-blue-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {getColumnTypeLabel(column.type)}
                        </span>
                      </div>
                      {displayValue !== null ? (
                        <dd className="font-medium text-sm text-neutral-900">
                          {displayValue}
                        </dd>
                      ) : (
                        <dd className="text-xs text-muted-foreground italic">
                          No data available
                        </dd>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContentWithFocus>
                    <ContextMenuItem onClick={() => onVisualise(column.name)}>
                      <Palette size={12} />
                      Visualise on map
                    </ContextMenuItem>
                  </ContextMenuContentWithFocus>
                </ContextMenu>
              );
            }
            
            // Process numeric values - use RAW value for display
            let numericValue = rawValue;
            
            // Step 1: Apply scale normalization ONLY for bar width calculation, not for display
            let normalizedValue: number | null = null;
            if (settings?.isScale) {
              normalizedValue = getScaledValue(numericValue);
            }
            
            // Step 2: Apply percentage conversion ONLY if explicitly enabled in settings
            // Default: show actual values (0.5, 0.8, 1, 2, etc.) - NOT as percentages
            const isPercentage = settings?.isPercentage && shouldShowAsPercentage(column, numericValue);
            let displayValue: string;
            let barWidth: number = 0; // Width for progress bar (0-100 range)
            
            if (isPercentage) {
              // Show as percentage - ONLY when explicitly enabled in group settings
              const percentageValue = numericValue * 100;
              displayValue = `${Math.round(percentageValue * 10) / 10}%`;
              barWidth = percentageValue; // Already 0-100 range
            } else {
              // Default: show ACTUAL raw value (0.5, 0.8, 1, 2, etc.)
              displayValue = formatNumber(numericValue);
              
              // Calculate bar width based on data range or settings
              // Use the RAW numericValue for scaling, not transformed values
              if (settings?.isScale && normalizedValue !== null) {
                // Use normalized value from scale bounds for bar width only
                barWidth = normalizedValue * 100;
              } else if (settings?.upperBound !== undefined && settings?.lowerBound !== undefined) {
                // Use custom scale bounds
                const range = settings.upperBound - settings.lowerBound;
                if (range > 0) {
                  barWidth = ((numericValue - settings.lowerBound) / range) * 100;
                } else {
                  barWidth = 0;
                }
              } else {
                // Use actual data range (min/max from all values in group)
                const range = maxValue - minValue;
                if (range > 0) {
                  barWidth = ((numericValue - minValue) / range) * 100;
                } else {
                  barWidth = 0;
                }
              }
              barWidth = Math.max(0, Math.min(100, barWidth));
            }
            
            // Always show progress bar for percentages or numeric values
            // (unless bar chart is shown, which replaces individual progress bars)
            const showProgressBar = !settings?.showAsBarChart && (
              isPercentage || 
              (column.type === ColumnType.Number && typeof numericValue === "number")
            );

            return (
              <ContextMenu key={column.name}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "flex flex-col gap-1 p-2 rounded cursor-pointer transition-colors",
                      isVisualized
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <dt
                        className={cn(
                          "text-xs uppercase font-mono flex items-center gap-1",
                          isVisualized
                            ? "text-blue-700"
                            : "text-muted-foreground"
                        )}
                      >
                        {column.name}
                        {isVisualized && (
                          <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
                            Visualised
                          </span>
                        )}
                      </dt>
                      <span
                        className={cn(
                          "text-[10px]",
                          isVisualized
                            ? "text-blue-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {getColumnTypeLabel(column.type)}
                      </span>
                    </div>
                    <dd className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          isVisualized ? "text-blue-900" : "text-neutral-900"
                        )}
                      >
                        {displayValue}
                      </span>
                      {showProgressBar && (
                        <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              isVisualized ? "bg-blue-600" : "bg-neutral-400"
                            )}
                            style={{ 
                              width: `${barWidth}%` 
                            }}
                          />
                        </div>
                      )}
                    </dd>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContentWithFocus>
                  <ContextMenuItem onClick={() => onVisualise(column.name)}>
                    <Palette size={12} />
                    Visualise on map
                  </ContextMenuItem>
                </ContextMenuContentWithFocus>
              </ContextMenu>
            );
          })}
        </div>
      )}
      <GroupSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        groupName={groupName}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
