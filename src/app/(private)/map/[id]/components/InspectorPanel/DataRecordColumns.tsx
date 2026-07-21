import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ValueBadge from "@/components/ValueBadge";
import { useColumnValues } from "@/hooks/useColumnValues";
import { useDataSources } from "@/hooks/useDataSources";
import { ColumnType } from "@/models/DataSource";
import {
  MarkerColorMode,
  MarkerIconMode,
  MarkerSizeMode,
} from "@/models/MapView";
import { ColumnDisplayFormat, InspectorComparisonStat } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import { cn } from "@/shadcn/utils";
import { formatNumber } from "@/utils/text";
import { PARTY_COLORS } from "../../constants";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useInspectorColumn } from "../../hooks/useInspectorColumn";
import { useInspectorDataSourceConfig } from "../../hooks/useInspectorDataSourceConfig";
import { useMapViews } from "../../hooks/useMapViews";
import { useMarkerSettings } from "../../hooks/useMarkerSettings";
import { getDisplayValue, parseColumnNumber } from "../../utils/stats";
import BooleanValueDisplay from "../BooleanValueDisplay";
import {
  buildCategoryColorMap,
  getOrderedSizeFactors,
} from "../Markers/markerStyle";
import MarkerShapeIcon from "../MarkerShapeIcon";
import { getBarColorForLabel } from "./inspectorPanelOptions";
import { PropertyLabel } from "./PropertyLabel";
import type { ColumnMetadata } from "@/models/DataSource";
import type { InspectorColumn } from "@/models/shared";

// ============================================================================
// Internal rendering helpers
// ============================================================================

function barFill(barColor?: string): string {
  return barColor?.trim() ? barColor : "var(--primary)";
}

function variancePercent(value: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return ((value - baseline) / baseline) * 100;
}

function rgbToRgba(rgb: string, alpha: number): string | null {
  const match = rgb
    .trim()
    .match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (!match) return null;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PARTY_LABELS: Record<string, string> = {
  con: "Conservative",
  lab: "Labour",
  ld: "Liberal Democrats",
  ruk: "Reform UK",
  green: "Green",
  snp: "SNP",
  pc: "Plaid Cymru",
  dup: "DUP",
  sf: "Sinn Féin",
  sdlp: "SDLP",
  uup: "UUP",
  apni: "Alliance",
  ind: "Independent",
};

interface SubRendererProps {
  value: unknown;
  inspectorColumn: InspectorColumn;
  dataSourceId: string | undefined;
  columnMetadata?: ColumnMetadata | undefined;
  columnType?: ColumnType | null;
  inspectorColor?: string | null;
}

function TextOrNumberValue({
  value,
  columnMetadata,
  columnType,
  dataSourceId,
}: Pick<
  SubRendererProps,
  "value" | "columnMetadata" | "columnType" | "dataSourceId"
>) {
  const { getDataSourceById } = useDataSources();
  const text = getDisplayValue(value, {
    isCount: false,
    columnType: columnType ?? ColumnType.Number,
    columnMetadata,
    dateFormat: getDataSourceById(dataSourceId ?? "")?.dateFormat,
  });
  const rawString = typeof value === "string" ? value.trim() : null;
  const rawStringLower = rawString ? rawString.toLowerCase() : null;
  const smartColor = rawStringLower
    ? (PARTY_COLORS[rawStringLower] ?? null)
    : null;
  const smartBg = smartColor ? rgbToRgba(smartColor, 0.12) : null;
  const displayText =
    rawStringLower && smartColor
      ? (PARTY_LABELS[rawStringLower] ?? text)
      : text;
  return (
    <span
      className={cn(
        "font-medium tabular-nums whitespace-normal break-all min-w-0 inline-flex items-baseline gap-2 rounded px-1.5 py-0.5",
        smartBg ? "border border-black/5" : "px-0 py-0 rounded-none border-0",
      )}
      style={smartBg ? { backgroundColor: smartBg } : undefined}
    >
      {smartColor ? (
        <span
          className="h-2.5 w-2.5 rounded-sm border border-neutral-300 shrink-0 translate-y-px"
          style={{ backgroundColor: smartColor }}
          aria-hidden
        />
      ) : null}
      <span className="min-w-0">{displayText}</span>
    </span>
  );
}

function LargeTextValue({
  value,
  columnMetadata,
  columnType,
  dataSourceId,
}: Pick<
  SubRendererProps,
  "value" | "columnMetadata" | "columnType" | "dataSourceId"
>) {
  const { getDataSourceById } = useDataSources();
  const text = getDisplayValue(value, {
    isCount: false,
    columnType: columnType ?? ColumnType.String,
    columnMetadata,
    dateFormat: getDataSourceById(dataSourceId ?? "")?.dateFormat,
  });
  return (
    <p className="whitespace-pre-wrap break-words text-xl text-neutral-800">
      {text}
    </p>
  );
}

function NumberWithComparisonValue({
  value,
  inspectorColumn,
  dataSourceId,
  columnMetadata,
}: Omit<SubRendererProps, "columnType">) {
  const num = parseColumnNumber(value, {
    isCount: false,
    columnMetadata,
  });
  const comparisonStat =
    inspectorColumn.comparisonStat || InspectorComparisonStat.Average;

  const trpc = useTRPC();
  const baselineQuery = useQuery(
    trpc.dataRecord.columnStat.queryOptions(
      {
        dataSourceId: dataSourceId || "",
        columnName: inspectorColumn.name,
        stat: comparisonStat,
      },
      { enabled: Boolean(dataSourceId) },
    ),
  );

  if (num === null) {
    return <span className="font-medium">-</span>;
  }

  const baseline = baselineQuery.data ?? null;
  let pct = baseline !== null ? variancePercent(num, baseline) : null;
  let pctLabel =
    pct !== null
      ? pct >= 0
        ? `+${pct.toFixed(1)}%`
        : `${pct.toFixed(1)}%`
      : null;
  if (comparisonStat === InspectorComparisonStat.Min && baseline === 0) {
    pct = Infinity;
    pctLabel = "+Inf";
  }
  const statAbbrev = String(comparisonStat).substring(0, 3).toLowerCase();
  const suffix = statAbbrev ? ` ${statAbbrev}` : "";
  const title =
    comparisonStat && baseline !== null
      ? `vs ${comparisonStat}: ${formatNumber(baseline)}`
      : undefined;

  if (baselineQuery.isLoading) {
    return (
      <span
        className="font-medium tabular-nums inline-flex items-baseline gap-1.5 flex-wrap"
        title={title}
      >
        <span>{formatNumber(num)}</span>
        <span className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
          <span>{suffix ? suffix.trim() : "…"}</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className="font-medium tabular-nums inline-flex items-baseline gap-1.5 flex-wrap"
      title={title}
    >
      <span>{formatNumber(num)}</span>
      <span
        className={cn(
          "text-xs font-medium text-muted-foreground",
          pct !== null && pct > 0 && "text-green-700",
          pct !== null && pct < 0 && "text-red-700",
        )}
      >
        {pctLabel !== null ? `${pctLabel}${suffix}` : `—${suffix}`}
      </span>
    </span>
  );
}

function PercentageBarValue({
  value,
  inspectorColumn,
  columnMetadata,
  inspectorColor,
}: Omit<SubRendererProps, "dataSourceId" | "columnType">) {
  const num = parseColumnNumber(value, {
    isCount: false,
    columnMetadata,
  });
  const fill = barFill(
    getBarColorForLabel({
      columnName: inspectorColumn.name,
      displayName: columnMetadata?.displayName,
      barColor: inspectorColumn.barColor,
      inspectorColor,
    }),
  );

  if (num === null) {
    return <span className="font-medium">-</span>;
  }

  const pct = Math.min(100, Math.max(0, num));
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="h-2 flex-1 min-w-0 rounded-full bg-neutral-200 overflow-hidden"
        title={`${pct.toFixed(0)}%`}
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums shrink-0 w-8 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function ScaleValue({
  value,
  inspectorColumn,
  columnMetadata,
  inspectorColor,
}: Omit<SubRendererProps, "dataSourceId" | "columnType">) {
  const num = parseColumnNumber(value, {
    isCount: false,
    columnMetadata,
  });
  const fill = barFill(
    getBarColorForLabel({
      columnName: inspectorColumn.name,
      displayName: columnMetadata?.displayName,
      barColor: inspectorColumn.barColor,
      inspectorColor,
    }),
  );

  if (num === null) {
    return <span className="font-medium">-</span>;
  }

  const max = Math.max(2, Math.min(10, inspectorColumn.scaleMax || 2));
  const filled = Math.min(max, Math.max(0, Math.round(num)));
  return (
    <div className="flex items-center gap-1" title={`${filled} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 flex-1 min-w-[6px] rounded-sm transition-colors",
            i < filled ? "" : "bg-neutral-200",
          )}
          style={i < filled ? { backgroundColor: fill } : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Value renderer for columns that drive the marker visualisation: decodes the
 * record's map encodings inline — icon shape, colour badge, size dot — using
 * the same resolution as the map and legend. A column can carry several
 * encodings at once, and this display overrides any configured format.
 */
function MarkerEncodingValue({
  value,
  name,
  dataSourceId,
  isIcon,
  isColor,
  isSize,
  columnMetadata,
  columnType,
}: {
  value: unknown;
  name: string;
  dataSourceId: string | undefined;
  isIcon: boolean;
  isColor: boolean;
  isSize: boolean;
  columnMetadata: ColumnMetadata | undefined;
  columnType: ColumnType | null | undefined;
}) {
  const { getMarkerVisualisation } = useMarkerSettings();
  const { viewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const dataSource = getDataSourceById(dataSourceId);
  // Canonical distinct values, so badge colours and dot sizes match the map
  const columnValues = useColumnValues({
    dataSourceId: dataSourceId ?? "",
    column: name,
    columnType: columnType ?? ColumnType.Unknown,
    nullIsZero: dataSource?.nullIsZero,
    enabled: Boolean(dataSourceId) && (isColor || isSize),
  });

  const text = getDisplayValue(value, {
    isCount: false,
    columnType: columnType ?? ColumnType.String,
    columnMetadata,
    dateFormat: dataSource?.dateFormat,
  });
  if (text === "-") {
    return <span className="font-medium">-</span>;
  }
  const key =
    typeof value === "string" || typeof value === "number" ? String(value) : "";

  const shape = isIcon ? columnMetadata?.valueIcons?.[key] : undefined;

  let badgeColor: string | undefined;
  if (isColor && dataSourceId) {
    const colorMap = buildCategoryColorMap({
      dataSourceId,
      column: name,
      values: columnValues ?? [],
      colorMappings: viewConfig.colorMappings,
      columnMetadata,
    });
    badgeColor = colorMap[key];
  }

  let sizeFactor: number | undefined;
  if (isSize) {
    const factors = getOrderedSizeFactors({
      values: columnValues ?? [],
      columnMetadata,
      descending: getMarkerVisualisation(dataSourceId ?? "").sizeSortDesc,
    });
    sizeFactor = factors.find((f) => f.value === key)?.factor;
  }

  return (
    <span className="font-medium inline-flex items-center gap-1.5 min-w-0">
      {shape && (
        <MarkerShapeIcon shape={shape} color={badgeColor ?? "#404040"} />
      )}
      {sizeFactor !== undefined && (
        <span
          className="w-[18px] flex items-center justify-center shrink-0"
          aria-hidden
        >
          <span
            className="rounded-full bg-neutral-400"
            style={{
              width: `${Math.round(sizeFactor * 10)}px`,
              height: `${Math.round(sizeFactor * 10)}px`,
            }}
          />
        </span>
      )}
      {badgeColor ? (
        <ValueBadge color={badgeColor}>{text}</ValueBadge>
      ) : (
        <span className="min-w-0">{text}</span>
      )}
    </span>
  );
}

function DataRecordPropertyValue({
  value,
  name,
  dataSourceId,
}: {
  value: unknown;
  name: string;
  dataSourceId: string | undefined;
}) {
  const { columnMetadata, columnDef } = useDataSourceColumn(dataSourceId, name);
  const inspectorColumn = useInspectorColumn(dataSourceId, name);
  const inspectorConfig = useInspectorDataSourceConfig(dataSourceId);
  const { getMarkerVisualisation } = useMarkerSettings();

  // Columns driving the marker visualisation decode the marker's encodings
  // inline, overriding any configured display format
  const visualisation = getMarkerVisualisation(dataSourceId ?? "");
  const isIcon =
    visualisation.iconMode === MarkerIconMode.Categories &&
    visualisation.iconColumn === name;
  const isColor =
    visualisation.colorMode === MarkerColorMode.Categories &&
    visualisation.colorColumn === name;
  const isSize =
    visualisation.sizeMode === MarkerSizeMode.Scaled &&
    visualisation.sizeColumn === name;
  if (isIcon || isColor || isSize) {
    return (
      <MarkerEncodingValue
        value={value}
        name={name}
        dataSourceId={dataSourceId}
        isIcon={isIcon}
        isColor={isColor}
        isSize={isSize}
        columnMetadata={columnMetadata}
        columnType={columnDef?.type}
      />
    );
  }

  const format = inspectorColumn?.displayFormat;

  if (
    !inspectorColumn ||
    format === ColumnDisplayFormat.Number ||
    format === ColumnDisplayFormat.Text ||
    !format
  ) {
    return (
      <TextOrNumberValue
        value={value}
        columnMetadata={columnMetadata}
        columnType={columnDef?.type}
        dataSourceId={dataSourceId}
      />
    );
  }

  if (format === ColumnDisplayFormat.NumberWithComparison) {
    return (
      <NumberWithComparisonValue
        value={value}
        inspectorColumn={inspectorColumn}
        dataSourceId={dataSourceId}
        columnMetadata={columnMetadata}
      />
    );
  }

  if (format === ColumnDisplayFormat.Percentage) {
    return (
      <PercentageBarValue
        value={value}
        inspectorColumn={inspectorColumn}
        columnMetadata={columnMetadata}
        inspectorColor={inspectorConfig?.color}
      />
    );
  }

  if (format === ColumnDisplayFormat.Scale) {
    return (
      <ScaleValue
        value={value}
        inspectorColumn={inspectorColumn}
        columnMetadata={columnMetadata}
        inspectorColor={inspectorConfig?.color}
      />
    );
  }

  if (format === ColumnDisplayFormat.Boolean) {
    return <BooleanValueDisplay value={value} />;
  }

  if (format === ColumnDisplayFormat.LargeText) {
    return (
      <LargeTextValue
        value={value}
        columnMetadata={columnMetadata}
        columnType={columnDef?.type}
        dataSourceId={dataSourceId}
      />
    );
  }

  return (
    <TextOrNumberValue
      value={value}
      columnMetadata={columnMetadata}
      columnType={columnDef?.type}
      dataSourceId={dataSourceId}
    />
  );
}

// ============================================================================
// DataRecordColumns
// Renders a list of columns with labels and formatted values.
// ============================================================================

function DataRecordColumnItem({
  column,
  json,
  dataSourceId,
}: {
  column: string;
  json: Record<string, unknown>;
  dataSourceId: string | undefined;
}) {
  const inspectorColumn = useInspectorColumn(dataSourceId, column);
  const isLargeText =
    inspectorColumn?.displayFormat === ColumnDisplayFormat.LargeText;
  return (
    <div className={cn("min-w-0", isLargeText && "col-span-2")}>
      <PropertyLabel column={column} dataSourceId={dataSourceId} />
      <dd
        className={cn(
          "min-w-0 whitespace-normal",
          isLargeText ? "break-words" : "break-all",
        )}
      >
        <DataRecordPropertyValue
          value={json[column]}
          name={column}
          dataSourceId={dataSourceId}
        />
      </dd>
    </div>
  );
}

export default function DataRecordColumns({
  columns,
  json,
  dataSourceId,
}: {
  columns?: string[];
  json: Record<string, unknown>;
  dataSourceId: string | undefined;
}) {
  const safeColumns = columns ?? Object.keys(json);
  return (
    <>
      {safeColumns.map((column, index) => (
        <DataRecordColumnItem
          key={`${column}-${index}`}
          column={column}
          json={json}
          dataSourceId={dataSourceId}
        />
      ))}
    </>
  );
}
