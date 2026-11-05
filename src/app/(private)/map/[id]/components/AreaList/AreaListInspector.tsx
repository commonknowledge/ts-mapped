"use client";

import {
  ArrowDownIcon,
  Loader2,
  MousePointerClickIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AreaSetCodeLabels } from "@/labels";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { formatNumber } from "@/utils/text";
import { useAreaListInsights } from "../../hooks/useAreaListInsights";
import {
  useInspectedAreaList,
  useQuickAddAreaList,
} from "../../hooks/useAreaLists";
import { useGoToArea } from "../../hooks/useGoToArea";
import { useMarkerLayerColor } from "../../hooks/useMarkerLayerColor";
import { formatAreaListValue, toAreaListNumber } from "../../utils/areaList";
import RingSwatch from "../RingSwatch";
import AreaListMembers from "./AreaListMembers";
import type { AreaListColumn } from "../../hooks/useAreaListInsights";
import type { AreaList } from "@/models/Map";

// "name", "markers", or a column's key
type SortKey = string;

/**
 * A list of areas, in the inspector's place: what's in it (members and
 * other marker layers), the figures it was picked by and the data on the
 * map (each compared with all areas), each area one click from the map,
 * and everyone who lives in them
 */
export default function AreaListInspector({ list }: { list: AreaList }) {
  const { inspect } = useInspectedAreaList();
  const {
    list: quickAddList,
    start: startQuickAdd,
    stop: stopQuickAdd,
  } = useQuickAddAreaList();
  const isQuickAdding = quickAddList?.id === list.id;
  const goToArea = useGoToArea();
  const { layers, columns } = useAreaListInsights(list);
  // The first marker layer (usually members) gets a column in the table
  const leadLayer = layers[0] ?? null;
  // The list's own columns lead, members next, the map's column last
  const ownColumns = columns.filter((column) => column.source === "list");
  const mapColumns = columns.filter((column) => column.source === "map");
  const [sortKey, setSortKey] = useState<SortKey>(
    ownColumns[0]?.key ?? mapColumns[0]?.key ?? "name",
  );

  const rows = useMemo(() => {
    const sortColumn = columns.find((column) => column.key === sortKey);
    const byNumber = (a: unknown, b: unknown) =>
      (toAreaListNumber(b) ?? -Infinity) - (toAreaListNumber(a) ?? -Infinity);
    return [...list.areas].sort((a, b) => {
      if (sortKey === "markers") {
        return (
          (leadLayer?.byCode.get(b.code) ?? 0) -
          (leadLayer?.byCode.get(a.code) ?? 0)
        );
      }
      if (sortColumn?.isNumeric) {
        // A list picked by lowest values reads lowest first
        const order = byNumber(
          sortColumn.valueByCode.get(a.code),
          sortColumn.valueByCode.get(b.code),
        );
        // A list picked by lowest values (e.g. the most marginal seats)
        // reads lowest first by its own column
        const isLowestFirst =
          sortColumn.source === "list" && list.origin?.order === "lowest";
        return isLowestFirst ? -order : order;
      }
      return a.name.localeCompare(b.name);
    });
  }, [columns, leadLayer, list, sortKey]);

  const tableColumns = [
    ...ownColumns,
    ...(leadLayer ? ["markers" as const] : []),
    ...mapColumns,
  ];
  const gridTemplate = `minmax(0,1fr) repeat(${tableColumns.length}, 3.75rem)`;

  return (
    <div
      id="inspector-panel"
      className="relative z-50 flex min-h-0 max-h-full flex-col rounded bg-white font-sans text-sm shadow-lg pointer-events-auto"
    >
      <div className="flex items-start gap-2 p-3">
        <span
          aria-hidden
          className="mt-1 size-3 shrink-0 rounded-sm"
          style={{ backgroundColor: list.color }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{list.name}</h1>
          <p className="font-mono text-[10px] tracking-wide text-neutral-500 uppercase">
            {list.areas.length} {list.areas.length === 1 ? "area" : "areas"} ·{" "}
            {AreaSetCodeLabels[list.areaSetCode]}
          </p>
        </div>
        <Button
          size="sm"
          variant={isQuickAdding ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() =>
            isQuickAdding ? stopQuickAdd() : startQuickAdd(list.id)
          }
          title="Click areas on the map to add or remove them"
        >
          <MousePointerClickIcon className="size-3.5" />
          {isQuickAdding ? "Done" : "Add areas"}
        </Button>
        <button
          type="button"
          onClick={() => inspect(null)}
          aria-label="Close list"
          className="cursor-pointer rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-t p-3">
        {list.areas.length === 0 ? (
          <p className="text-xs text-neutral-500">
            No areas yet. Click an area on the map, then &ldquo;Add to
            list&rdquo; in the inspector.
          </p>
        ) : (
          <>
            {/* Who's in these areas */}
            {layers.length > 0 && (
              <dl className="grid grid-cols-2 gap-2">
                {layers.map((layer) => (
                  <LayerFigure key={layer.id} layer={layer} />
                ))}
              </dl>
            )}

            {/* The figures it was picked by, then the data on the map */}
            {columns.map((column) => (
              <ColumnSummary key={column.key} column={column} list={list} />
            ))}
            {columns.length === 0 && (
              <p className="text-[11px] leading-snug text-neutral-500">
                Colour the map by data on{" "}
                {AreaSetCodeLabels[list.areaSetCode].toLowerCase()} to compare
                these areas with the rest.
              </p>
            )}

            {/* Each area */}
            <section className="flex flex-col">
              <div
                className="grid gap-2 border-b border-neutral-100 px-1.5 pb-1 text-[10px] tracking-wide text-neutral-500 uppercase"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <SortHeader
                  label="Area"
                  isActive={sortKey === "name"}
                  onClick={() => setSortKey("name")}
                />
                {tableColumns.map((column) =>
                  column === "markers" ? (
                    <SortHeader
                      key="markers"
                      label={shortName(leadLayer?.name ?? "Markers")}
                      isActive={sortKey === "markers"}
                      onClick={() => setSortKey("markers")}
                      alignEnd
                    />
                  ) : (
                    <SortHeader
                      key={column.key}
                      label={column.label}
                      title={
                        column.source === "map"
                          ? `${column.label} (on the map)`
                          : column.label
                      }
                      isActive={sortKey === column.key}
                      onClick={() => setSortKey(column.key)}
                      alignEnd
                      disabled={!column.isNumeric}
                    />
                  ),
                )}
              </div>
              <ol className="flex flex-col">
                {rows.map((row) => (
                  <li key={row.code}>
                    <button
                      type="button"
                      onClick={() =>
                        goToArea({
                          code: row.code,
                          name: row.name,
                          areaSetCode: list.areaSetCode,
                        })
                      }
                      title={`Go to ${row.name}`}
                      className="grid w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs hover:bg-neutral-100"
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      <span className="truncate">{row.name}</span>
                      {tableColumns.map((column) =>
                        column === "markers" ? (
                          <span
                            key="markers"
                            className="text-right tabular-nums text-neutral-700"
                          >
                            {leadLayer?.isPending
                              ? "…"
                              : formatNumber(
                                  leadLayer?.byCode.get(row.code) ?? 0,
                                )}
                          </span>
                        ) : (
                          <span
                            key={column.key}
                            className={cn(
                              "truncate text-right tabular-nums",
                              column.source === "map"
                                ? "text-neutral-500"
                                : "text-neutral-800",
                            )}
                          >
                            {formatAreaListValue(
                              column.valueByCode.get(row.code),
                            )}
                          </span>
                        ),
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            {/* Everyone in these areas, from the lead marker layer */}
            {leadLayer && (
              <AreaListMembers
                list={list}
                dataSourceId={leadLayer.id}
                label={leadLayer.name}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// One column across the list: its average against all areas, or for text,
// its commonest values
function ColumnSummary({
  column,
  list,
}: {
  column: AreaListColumn;
  list: AreaList;
}) {
  const difference =
    column.listMean !== null && column.allMean
      ? ((column.listMean - column.allMean) / Math.abs(column.allMean)) * 100
      : null;
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="flex items-baseline gap-1.5 font-mono text-[10px] tracking-wide text-neutral-500 uppercase">
        {column.label}
        <span className="normal-case tracking-normal text-neutral-400">
          {column.source === "list" ? "picked by" : "on the map"}
        </span>
      </h2>
      {column.isPending ? (
        <Loader2 className="size-3.5 animate-spin text-neutral-400" />
      ) : column.isNumeric ? (
        <div className="flex items-baseline gap-3 rounded-lg bg-neutral-50 px-3 py-2 shadow-[inset_0_0_0_1px_#ececec]">
          <span>
            <span className="text-base font-semibold tabular-nums">
              {column.listMean !== null ? formatNumber(column.listMean) : "–"}
            </span>
            <span className="ml-1 text-[11px] text-neutral-500">
              average here
            </span>
          </span>
          {column.allMean !== null && (
            <span className="text-[11px] text-neutral-500">
              vs {formatNumber(column.allMean)} across all areas
              {difference !== null && (
                <span
                  className={cn(
                    "ml-1 font-medium",
                    difference >= 0 ? "text-emerald-700" : "text-rose-700",
                  )}
                >
                  {difference >= 0 ? "+" : ""}
                  {Math.round(difference)}%
                </span>
              )}
            </span>
          )}
        </div>
      ) : column.topValues.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {column.topValues.map(([value, count]) => (
            <li key={value} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-xs">{value}</span>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100">
                <span
                  className="block h-full rounded-full bg-neutral-800"
                  style={{ width: `${(count / list.areas.length) * 100}%` }}
                />
              </span>
              <span className="w-6 text-right text-xs tabular-nums text-neutral-500">
                {count}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

// How many of a marker layer's records fall in the list, and their share
function LayerFigure({
  layer,
}: {
  layer: ReturnType<typeof useAreaListInsights>["layers"][number];
}) {
  const color = useMarkerLayerColor(layer.id);
  const share = layer.total ? (layer.inList / layer.total) * 100 : null;
  return (
    <div className="min-w-0 rounded-lg bg-neutral-50 px-2.5 py-2 shadow-[inset_0_0_0_1px_#ececec]">
      <dt className="flex items-center gap-1.5 truncate text-[11px] text-neutral-500">
        {color && <RingSwatch color={color} size={10} />}
        <span className="truncate">{layer.name}</span>
      </dt>
      <dd className="text-base font-semibold tabular-nums">
        {layer.isPending ? (
          <Loader2 className="my-1 size-3.5 animate-spin" />
        ) : (
          formatNumber(layer.inList)
        )}
      </dd>
      {share !== null && !layer.isPending && (
        <p className="text-[10px] text-neutral-500">
          {share < 1 && share > 0 ? "<1" : Math.round(share)}% of{" "}
          {formatNumber(layer.total)}
        </p>
      )}
    </div>
  );
}

function SortHeader({
  label,
  title,
  isActive,
  onClick,
  alignEnd = false,
  disabled = false,
}: {
  label: string;
  title?: string;
  isActive: boolean;
  onClick: () => void;
  alignEnd?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={cn(
        "flex min-w-0 cursor-pointer items-center gap-0.5 hover:text-neutral-900 disabled:cursor-default disabled:hover:text-neutral-500",
        alignEnd && "justify-end",
        isActive && "text-neutral-900",
      )}
    >
      <span className="truncate">{label}</span>
      {isActive && <ArrowDownIcon className="size-2.5 shrink-0" />}
    </button>
  );
}

// "Tutorial members" → "Members", to fit a column header
const shortName = (name: string) => {
  const last = name.trim().split(/\s+/).at(-1) ?? name;
  return last.charAt(0).toUpperCase() + last.slice(1);
};
