"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shadcn/ui/chart";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import { getBarColorForLabel } from "./inspectorPanelOptions";

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function InspectorChart({
  json,
  columnNames,
  columnMetadata,
  hideZeroValues,
}: {
  json: Record<string, unknown>;
  columnNames: string[];
  columnMetadata?: InspectorBoundaryConfig["columnMetadata"];
  hideZeroValues?: boolean;
}) {
  const meta = columnMetadata ?? {};
  const defaultFill = "hsl(var(--primary))";
  const chartData = useMemo(() => {
    const rows = columnNames.map((col, i) => {
      const num = parseNumeric(json[col]);
      const label = meta[col]?.displayName ?? col;
      const fill =
        getBarColorForLabel(label, col, i, meta[col]?.barColor) || defaultFill;
      return {
        label,
        value: num ?? 0,
        fill,
      };
    });
    return hideZeroValues ? rows.filter((d) => d.value !== 0) : rows;
  }, [json, columnNames, meta, hideZeroValues]);

  if (chartData.length === 0) return null;

  const chartConfig = useMemo(
    () => ({
      value: {
        label: "Value",
        color: defaultFill,
      },
    }),
    [],
  );

  /** Height scales with row count so all y-axis labels and bars stay visible */
  const rowHeight = 28;
  const chartHeight = Math.max(120, chartData.length * rowHeight);

  return (
    <div className="mb-3 rounded-md border border-neutral-200 bg-neutral-50/50 p-2">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto w-full"
        style={{ height: chartHeight }}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 4, right: 4, top: 4, bottom: 4 }}
          barSize={10}
        >
          <CartesianGrid horizontal={false} strokeDasharray="2 2" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={80}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Bar
            dataKey="value"
            fill={(entry) => entry.fill ?? defaultFill}
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
