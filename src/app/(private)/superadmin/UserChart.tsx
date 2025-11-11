"use client";

import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shadcn/ui/chart";

interface User {
  id: string;
  createdAt: string | Date;
  email: string;
  name: string;
  organisations: string[];
}

interface UserChartProps {
  users?: User[];
}

export function UserChart({ users }: UserChartProps) {
  const chartData = useMemo(() => {
    if (!users || users.length === 0) return [];

    // Group users by month
    const monthlyData = new Map<string, number>();

    users.forEach((user) => {
      if (user.createdAt) {
        const date =
          typeof user.createdAt === "string"
            ? parseISO(user.createdAt)
            : new Date(user.createdAt);
        const monthKey = format(date, "MMM yyyy");
        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
      }
    });

    // Convert to array and sort by date
    const sortedData = Array.from(monthlyData.entries())
      .map(([month, count]) => ({ month, users: count }))
      .sort((a, b) => {
        const dateA = parseISO(`01 ${a.month}`);
        const dateB = parseISO(`01 ${b.month}`);
        return dateA.getTime() - dateB.getTime();
      });

    // Calculate cumulative count
    let cumulative = 0;
    return sortedData.map((item) => {
      cumulative += item.users;
      return {
        month: item.month,
        users: item.users,
        total: cumulative,
      };
    });
  }, [users]);

  const chartConfig = {
    total: {
      label: "Total Users",
      color: "var(--brandBlue)",
    },
  } as const;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Users Created Over Time</CardTitle>
          <CardDescription>
            Showing total users and new users per month
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="total"
              type="natural"
              fill="url(#fillTotal)"
              stroke="var(--color-total)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
