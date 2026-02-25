"use client";

import { BarChart3 } from "lucide-react";
import type {
  InspectorBoundaryConfig,
  InspectorChartDataSource,
} from "@/server/models/MapView";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Switch } from "@/shadcn/ui/switch";

export function ChartSection({
  config,
  updateConfig,
}: {
  config: InspectorBoundaryConfig;
  updateConfig: (
    updater: (prev: InspectorBoundaryConfig) => InspectorBoundaryConfig,
  ) => void;
}) {
  return (
    <div className="space-y-2 border-b pb-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <Label className="text-muted-foreground">Chart</Label>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={config.chart?.enabled ?? false}
            onCheckedChange={(checked) =>
              updateConfig((prev) => ({
                ...prev,
                chart: {
                  enabled: checked,
                  dataSource: prev.chart?.dataSource ?? "percentage",
                  columnNames: prev.chart?.columnNames,
                  hideZeroValues: prev.chart?.hideZeroValues,
                  hideChartColumnsFromList:
                    prev.chart?.hideChartColumnsFromList,
                },
              }))
            }
          />
          <span className="text-sm">Show chart at top</span>
        </div>

        {(config.chart?.enabled ?? false) && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Data:
            </Label>
            <Select
              value={config.chart?.dataSource ?? "percentage"}
              onValueChange={(value: InspectorChartDataSource) =>
                updateConfig((prev) => {
                  const chart = prev.chart ?? {
                    enabled: true,
                    dataSource: "percentage" as const,
                    columnNames: undefined,
                  };
                  return {
                    ...prev,
                    chart: {
                      ...chart,
                      enabled: true,
                      dataSource: value,
                      columnNames:
                        value === "custom"
                          ? (chart.columnNames ?? [])
                          : undefined,
                    },
                  };
                })
              }
            >
              <SelectTrigger className="h-8 w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  Use columns with Percentage format
                </SelectItem>
                <SelectItem value="number">
                  Use columns with Number format
                </SelectItem>
                <SelectItem value="scale">
                  Use columns with Scale format
                </SelectItem>
                <SelectItem value="custom">
                  Select from Columns to show list
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {(config.chart?.enabled ?? false) && (
          <div className="flex items-center gap-2">
            <Switch
              checked={config.chart?.hideZeroValues ?? false}
              disabled={config.chart?.hideChartColumnsFromList ?? false}
              onCheckedChange={(checked) =>
                updateConfig((prev) => {
                  const ch = prev.chart ?? {
                    enabled: true,
                    dataSource: "percentage" as const,
                    columnNames: undefined,
                  };
                  return {
                    ...prev,
                    chart: {
                      ...ch,
                      hideZeroValues: checked,
                      hideChartColumnsFromList: checked
                        ? false
                        : ch.hideChartColumnsFromList,
                    },
                  };
                })
              }
            />
            <span className="text-sm">Hide zero values from the chart</span>
          </div>
        )}
        {(config.chart?.enabled ?? false) && (
          <div className="flex items-center gap-2">
            <Switch
              checked={config.chart?.hideChartColumnsFromList ?? false}
              disabled={config.chart?.hideZeroValues ?? false}
              onCheckedChange={(checked) =>
                updateConfig((prev) => {
                  const ch = prev.chart ?? {
                    enabled: true,
                    dataSource: "percentage" as const,
                    columnNames: undefined,
                  };
                  return {
                    ...prev,
                    chart: {
                      ...ch,
                      hideChartColumnsFromList: checked,
                      hideZeroValues: checked ? false : ch.hideZeroValues,
                    },
                  };
                })
              }
            />
            <span className="text-sm">
              Hide data used in chart from list below
            </span>
          </div>
        )}
      </div>
      {(config.chart?.enabled ?? false) &&
        (config.chart?.dataSource ?? "percentage") === "custom" && (
          <p className="text-xs text-muted-foreground">
            Tick &quot;Include in chart&quot; on each column in Columns to show
            below.
          </p>
        )}
    </div>
  );
}
