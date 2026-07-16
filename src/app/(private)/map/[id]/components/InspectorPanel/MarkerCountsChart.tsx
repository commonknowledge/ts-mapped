import { useMemo, useState } from "react";
import { getCategoryColorsKey } from "../../colors";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useMapViews } from "../../hooks/useMapViews";
import { formatCategoryValue } from "../Markers/markerStyle";
import type { MarkerFeature } from "@/types";

const COLLAPSED_ROW_COUNT = 7;
// neutral-700: bars only take a category colour when one has been assigned
const NEUTRAL_BAR_COLOR = "#404040";

/**
 * Bar chart of marker counts grouped by a column — a summary above the
 * boundary's marker list. The group-by column is chosen with the dropdown
 * rendered alongside this chart.
 */
export default function MarkerCountsChart({
  dataSourceId,
  column,
  markers,
}: {
  dataSourceId: string;
  column: string;
  markers: MarkerFeature[];
}) {
  const { viewConfig } = useMapViews();
  const { columnMetadata } = useDataSourceColumn(dataSourceId, column);
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const marker of markers) {
      const properties: Record<string, unknown> = marker.properties;
      const raw = properties[column];
      const value = raw === null || raw === undefined ? "" : String(raw);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [column, markers]);

  if (rows.length === 0) {
    return null;
  }

  const maxCount = rows[0].count;
  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_ROW_COUNT);
  const hiddenCount = rows.length - visibleRows.length;

  const getBarColor = (value: string) =>
    viewConfig.colorMappings?.[
      getCategoryColorsKey(dataSourceId, column, value)
    ] ??
    columnMetadata?.valueColors?.[value] ??
    NEUTRAL_BAR_COLOR;

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1.5">
        {visibleRows.map(({ value, count }) => (
          <li key={value} className="flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs truncate" title={value}>
                {formatCategoryValue(value, columnMetadata?.valueLabels)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {count}
              </span>
            </div>
            <div
              className="h-0.5 rounded-full"
              style={{
                width: `${(count / maxCount) * 100}%`,
                backgroundColor: getBarColor(value),
              }}
            />
          </li>
        ))}
      </ul>
      {(hiddenCount > 0 || expanded) && (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show fewer" : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
