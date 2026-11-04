"use client";

import { useState } from "react";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnSemanticType } from "@/models/DataSource";
import { ColumnDisplayFormat } from "@/models/shared";
import { formatNumber } from "@/utils/text";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { parseColumnNumber } from "../../utils/stats";
import InspectorFieldMenu from "./InspectorFieldMenu";

const INK = "#15213b";
// The plot's own units: the line is drawn in a 100 × 40 box, stretched to fit
const W = 100;
const H = 40;

/**
 * A divider group's columns as one line over time: the columns, in their
 * configured order, are the periods (e.g. "Jan 2019" … "Sep 2026"). One
 * series, so no legend; the latest value leads, and hovering shows each
 * period's value.
 */
export default function InspectorLineChart({
  columns,
  json,
  dataSourceId,
}: {
  columns: string[];
  json: Record<string, unknown>;
  dataSourceId: string;
}) {
  const { getDataSourceById } = useDataSources();
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);
  const dataSource = getDataSourceById(dataSourceId);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // The period right-clicked, kept while the menu is open and the pointer
  // has left the plot
  const [menuIndex, setMenuIndex] = useState<number | null>(null);

  const points = columns.map((name) => {
    const metadata = dataSource?.columnMetadata.find((m) => m.name === name);
    return {
      name,
      label: metadata?.displayName || name,
      value: parseColumnNumber(json[name], {
        isCount: false,
        columnMetadata: metadata,
      }),
      isPercentage:
        metadata?.semanticType === ColumnSemanticType.Percentage01 ||
        metadata?.semanticType === ColumnSemanticType.Percentage0100 ||
        inspectorConfig?.items?.some(
          (i) =>
            i.type === "column" &&
            i.name === name &&
            i.displayFormat === ColumnDisplayFormat.Percentage,
        ),
    };
  });
  const values = points
    .map((p) => p.value)
    .filter((v): v is number => v !== null);
  if (values.length < 2) {
    return <p className="text-xs text-muted-foreground">Not enough values</p>;
  }

  // Percentages here are rates (e.g. claimants per 100 residents), not
  // shares of a bar, so they're shown as "3.4%" without a 0–100 axis
  const isPercentage = points.every((p) => p.isPercentage);
  const format = (value: number) =>
    isPercentage ? `${formatNumber(value)}%` : formatNumber(value);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.12 || Math.abs(max) * 0.1 || 1;
  const low = min >= 0 ? Math.max(0, min - pad) : min - pad;
  const high = max + pad;
  const x = (index: number) =>
    points.length === 1 ? W / 2 : (index / (points.length - 1)) * W;
  const y = (value: number) => H - ((value - low) / (high - low)) * H;

  // Gaps in the data break the line rather than bridging it
  const path = points
    .map((p, i) =>
      p.value === null
        ? ""
        : `${i > 0 && points[i - 1].value !== null ? "L" : "M"}${x(i)},${y(p.value)}`,
    )
    .join("");

  const lastIndex = points.findLastIndex((p) => p.value !== null);
  const last = points[lastIndex];
  const shownIndex =
    hoverIndex !== null && points[hoverIndex].value !== null
      ? hoverIndex
      : null;
  const shown = shownIndex !== null ? points[shownIndex] : null;

  return (
    <figure className="flex flex-col gap-1.5">
      {/* The latest value leads; hovering swaps in the hovered period */}
      <figcaption className="flex items-baseline gap-2">
        <span className="text-base font-semibold tabular-nums text-neutral-900">
          {format((shown ?? last).value ?? 0)}
        </span>
        <span className="text-[11px] text-neutral-500">
          {(shown ?? last).label}
        </span>
      </figcaption>

      <div className="flex gap-1.5">
        {/* Range only: the axis stays quiet */}
        <div className="flex h-24 w-8 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-neutral-400">
          <span>{format(max)}</span>
          <span>{format(min)}</span>
        </div>

        {/* Right-click adds the period under the pointer */}
        <InspectorFieldMenu
          dataSourceId={dataSourceId}
          column={points[menuIndex ?? lastIndex].name}
          label={points[menuIndex ?? lastIndex].label}
          showButton={false}
          className="min-w-0 flex-1 hover:bg-transparent data-[state=open]:bg-transparent"
        >
          <div
            className="relative h-24 min-w-0 flex-1"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              setHoverIndex(
                Math.max(
                  0,
                  Math.min(
                    points.length - 1,
                    Math.round(ratio * (points.length - 1)),
                  ),
                ),
              );
            }}
            onMouseLeave={() => setHoverIndex(null)}
            onContextMenu={() => setMenuIndex(shownIndex ?? lastIndex)}
            role="img"
            aria-label={`${points[0].label} to ${last.label}: ${format(
              points.find((p) => p.value !== null)?.value ?? 0,
            )} to ${format(last.value ?? 0)}`}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
              aria-hidden
            >
              {/* Top and bottom of the range */}
              {[y(max), y(min)].map((lineY) => (
                <line
                  key={lineY}
                  x1={0}
                  x2={W}
                  y1={lineY}
                  y2={lineY}
                  stroke="#e5e5e5"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path
                d={path}
                fill="none"
                stroke={INK}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Crosshair and point, in HTML so they don't stretch */}
            {shownIndex !== null && shown?.value != null && (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-px bg-neutral-300"
                  style={{ left: `${x(shownIndex)}%` }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#15213b] shadow-[0_0_0_1px_#15213b]"
                  style={{
                    left: `${x(shownIndex)}%`,
                    top: `${(y(shown.value) / H) * 100}%`,
                  }}
                />
              </>
            )}
            {shownIndex === null && last.value !== null && (
              <span
                aria-hidden
                className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#15213b]"
                style={{
                  left: `${x(lastIndex)}%`,
                  top: `${(y(last.value) / H) * 100}%`,
                }}
              />
            )}
          </div>
        </InspectorFieldMenu>
      </div>

      <div className="ml-[2.375rem] flex justify-between text-[10px] text-neutral-400">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </figure>
  );
}
