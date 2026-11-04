"use client";

import { useDataSources } from "@/hooks/useDataSources";
import { ColumnSemanticType } from "@/models/DataSource";
import { ColumnDisplayFormat } from "@/models/shared";
import { formatNumber } from "@/utils/text";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { parseColumnNumber } from "../../utils/stats";
import InspectorFieldMenu from "./InspectorFieldMenu";
import { getBarColorForLabel } from "./inspectorPanelOptions";

// A divider group's columns as one horizontal bar chart, largest first, so
// related figures (vote shares, age bands) read as a ranking. Empty and
// zero values are left out and counted underneath.
export default function InspectorBarChart({
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

  const rows = columns
    .map((name) => {
      const metadata = dataSource?.columnMetadata.find((m) => m.name === name);
      const item = inspectorConfig?.items?.find(
        (i) => i.type === "column" && i.name === name,
      );
      const column = item?.type === "column" ? item : undefined;
      const isPercentage =
        column?.displayFormat === ColumnDisplayFormat.Percentage ||
        metadata?.semanticType === ColumnSemanticType.Percentage01 ||
        metadata?.semanticType === ColumnSemanticType.Percentage0100;
      return {
        name,
        label: metadata?.displayName || name,
        value: parseColumnNumber(json[name], {
          isCount: false,
          columnMetadata: metadata,
        }),
        isPercentage,
        color: getBarColorForLabel({
          columnName: name,
          displayName: metadata?.displayName,
          barColor: column?.barColor,
          inspectorColor: inspectorConfig?.color,
        }),
      };
    })
    .filter((row): row is typeof row & { value: number } => row.value !== null)
    .sort((a, b) => b.value - a.value);

  // Shares are drawn out of 100%; other figures against the largest
  const allPercentages = rows.length > 0 && rows.every((r) => r.isPercentage);
  const scale = allPercentages
    ? 100
    : Math.max(...rows.map((r) => r.value), 0) || 1;
  const shown = rows.filter((r) => r.value > 0);
  const zeroCount = rows.length - shown.length;
  // "CON %" reads as "CON" when every bar is already a percentage
  const tidyLabel = (label: string) =>
    allPercentages ? label.replace(/\s*%$/, "") : label;

  if (shown.length === 0) {
    return <p className="text-xs text-muted-foreground">No values</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-0.5">
        {shown.map((row) => (
          <li key={row.name} title={row.label}>
            <InspectorFieldMenu
              dataSourceId={dataSourceId}
              column={row.name}
              label={tidyLabel(row.label)}
              showButton={false}
              className="-mx-1.5 grid grid-cols-[5.5rem_1fr_2.75rem] items-center gap-2 px-1.5 py-0.5 text-xs"
            >
              <span className="truncate text-neutral-600">
                {tidyLabel(row.label)}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (row.value / scale) * 100)}%`,
                    backgroundColor: row.color,
                  }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">
                {allPercentages
                  ? `${row.value < 10 ? row.value.toFixed(1) : Math.round(row.value)}%`
                  : formatNumber(row.value)}
              </span>
            </InspectorFieldMenu>
          </li>
        ))}
      </ul>
      {zeroCount > 0 && (
        <p className="text-[11px] text-neutral-400">
          {zeroCount} more at {allPercentages ? "0%" : "0"}
        </p>
      )}
    </div>
  );
}
