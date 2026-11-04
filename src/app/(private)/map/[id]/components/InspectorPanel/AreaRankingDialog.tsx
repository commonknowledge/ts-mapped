"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ListPlusIcon,
  Loader2,
  SearchIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDataSources } from "@/hooks/useDataSources";
import { AreaSetCodeLabels } from "@/labels";
import { ColumnSemanticType } from "@/models/DataSource";
import { ColumnDisplayFormat, DEFAULT_CALCULATION_TYPE } from "@/models/shared";
import { useTRPC } from "@/services/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { cn } from "@/shadcn/utils";
import { formatNumber, ordinal } from "@/utils/text";
import { AREA_LIST_FROM_RANKING } from "../../constants";
import { useAreaLists } from "../../hooks/useAreaLists";
import { useChoropleth } from "../../hooks/useChoropleth";
import { useDataSourceColumn } from "../../hooks/useDataSourceColumn";
import { useGoToArea } from "../../hooks/useGoToArea";
import { useInspectorColumn } from "../../hooks/useInspectorColumn";
import { useInspectorState } from "../../hooks/useInspectorState";
import { useMapViews } from "../../hooks/useMapViews";
import { useSavedVisualisations } from "../../hooks/useSavedVisualisations";
import { parseColumnNumber } from "../../utils/stats";
import type { AreaSetCode } from "@/models/AreaSet";

const INK = "#15213b";

/**
 * A column's value in every area of the boundaries being inspected (or
 * shown on the map), ranked, with the inspected area highlighted. Numbers
 * are ranked by size with a bar each; text values are listed A–Z.
 */
export default function AreaRankingDialog({
  open,
  onOpenChange,
  dataSourceId,
  column,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSourceId: string;
  column: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-3 p-0 sm:max-w-md">
        {/* Only fetches while open */}
        {open && (
          <AreaRanking
            dataSourceId={dataSourceId}
            column={column}
            onGoTo={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AreaRanking({
  dataSourceId,
  column,
  onGoTo,
}: {
  dataSourceId: string;
  column: string;
  /** After an area is chosen, so the map can be seen */
  onGoTo: () => void;
}) {
  const trpc = useTRPC();
  const goToArea = useGoToArea();
  const { createList } = useAreaLists();
  const { viewConfig } = useMapViews();
  const { getDataSourceById } = useDataSources();
  const { selectedBoundary } = useInspectorState();
  const { choroplethLayerConfig } = useChoropleth();
  const { items } = useSavedVisualisations();
  const { columnMetadata } = useDataSourceColumn(dataSourceId, column);
  const inspectorColumn = useInspectorColumn(dataSourceId, column);
  const [search, setSearch] = useState("");
  const [isAscending, setIsAscending] = useState(false);
  const selectedRef = useRef<HTMLLIElement>(null);

  // The boundaries being inspected, or else the ones on the map
  const areaSetCode: AreaSetCode =
    selectedBoundary?.areaSetCode ?? choroplethLayerConfig.areaSetCode;
  const selectedCode =
    selectedBoundary?.areaSetCode === areaSetCode
      ? selectedBoundary.code
      : undefined;

  // Combined as it is (or would be) on the map
  const isActive =
    viewConfig.areaDataSourceId === dataSourceId &&
    viewConfig.areaDataColumn === column;
  const calculationType =
    (isActive ? viewConfig.calculationType : null) ??
    items.find(
      (item) =>
        item.areaDataSourceId === dataSourceId &&
        item.areaDataColumn === column,
    )?.calculationType ??
    getDataSourceById(dataSourceId)?.defaultChoroplethConfig?.calculationType ??
    DEFAULT_CALCULATION_TYPE;

  const { data, isPending, error } = useQuery(
    trpc.area.ranking.queryOptions({
      dataSourceId,
      areaSetCode,
      calculationType,
      column,
    }),
  );

  const isPercentage =
    inspectorColumn?.displayFormat === ColumnDisplayFormat.Percentage ||
    columnMetadata?.semanticType === ColumnSemanticType.Percentage01 ||
    columnMetadata?.semanticType === ColumnSemanticType.Percentage0100;

  const ranked = useMemo(() => {
    const rows = (data?.rows ?? []).map((row) => ({
      ...row,
      number: parseColumnNumber(row.value, { isCount: false, columnMetadata }),
    }));
    const isNumeric =
      rows.length > 0 &&
      rows.filter((r) => r.number !== null).length >= rows.length / 2;
    const sorted = isNumeric
      ? [...rows].sort((a, b) => {
          // Areas without a value go last either way
          if (a.number === null) return 1;
          if (b.number === null) return -1;
          return isAscending ? a.number - b.number : b.number - a.number;
        })
      : [...rows].sort((a, b) =>
          String(a.value ?? "").localeCompare(String(b.value ?? "")),
        );
    const numbers = rows
      .map((r) => r.number)
      .filter((n): n is number => n !== null);
    return {
      isNumeric,
      rows: sorted.map((row, index) => ({ ...row, rank: index + 1 })),
      max: Math.max(...numbers, 0),
      min: Math.min(...numbers, 0),
    };
  }, [data?.rows, columnMetadata, isAscending]);

  const query = search.trim().toLowerCase();
  const shown = query
    ? ranked.rows.filter((row) => row.name.toLowerCase().includes(query))
    : ranked.rows;

  // Open on the inspected area
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, [data]);

  const format = (row: (typeof ranked.rows)[number]) => {
    if (row.number === null) {
      return row.value === null || row.value === undefined || row.value === ""
        ? "–"
        : String(row.value);
    }
    return isPercentage
      ? `${formatNumber(row.number)}%`
      : formatNumber(row.number);
  };
  // Bars start at zero, or at the lowest value when there are negatives
  const span = ranked.max - Math.min(ranked.min, 0) || 1;
  const selectedRow = ranked.rows.find((row) => row.code === selectedCode);
  const label = columnMetadata?.displayName || column;
  const areaLabel = AreaSetCodeLabels[areaSetCode] ?? "area";

  return (
    <>
      <DialogHeader className="gap-1 px-5 pt-5">
        <DialogTitle className="text-base">{label}</DialogTitle>
        <DialogDescription className="text-xs">
          By {areaLabel.toLowerCase()}
          {data ? ` · ${data.rows.length} areas` : ""}
          {selectedRow && ranked.isNumeric
            ? ` · ${selectedRow.name} is ${ordinal(selectedRow.rank)}`
            : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-2 px-5">
        <label className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-input px-2">
          <SearchIcon className="size-3.5 shrink-0 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${areaLabel.toLowerCase()}s`}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
        </label>
        {ranked.isNumeric && (
          <button
            type="button"
            onClick={() => setIsAscending(!isAscending)}
            data-tour="ranking-sort"
            data-ascending={isAscending}
            className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-input px-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            {isAscending ? (
              <ArrowUpIcon className="size-3.5" />
            ) : (
              <ArrowDownIcon className="size-3.5" />
            )}
            {isAscending ? "Lowest first" : "Highest first"}
          </button>
        )}
        {ranked.isNumeric && shown.length > 0 && (
          // The first ten as shown (sorted and searched) become a list
          <button
            type="button"
            onClick={() => {
              const top = shown.slice(0, AREA_LIST_FROM_RANKING);
              const list = createList({
                name: `${isAscending ? "Lowest" : "Highest"} ${top.length} by ${label}`,
                areaSetCode,
                areas: top.map((row) => ({ code: row.code, name: row.name })),
                origin: {
                  dataSourceId,
                  calculationType,
                  columns: [{ name: column, label }],
                  order: isAscending ? "lowest" : "highest",
                },
              });
              toast.success(`Made ${list.name}, under Areas`);
            }}
            title={`Make a list of the first ${AREA_LIST_FROM_RANKING} shown`}
            data-tour="list-top"
            data-ascending={isAscending}
            className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-input px-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <ListPlusIcon className="size-3.5" />
            List top {AREA_LIST_FROM_RANKING}
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {isPending ? (
          <p className="flex items-center gap-2 px-2 py-6 text-xs text-neutral-500">
            <Loader2 className="size-3.5 animate-spin" />
            Loading areas…
          </p>
        ) : error ? (
          <p className="px-2 py-6 text-xs text-neutral-500">
            {error.message === "Too many areas to compare"
              ? `There are too many ${areaLabel.toLowerCase()}s to list. Choose larger boundaries.`
              : "Couldn't load the areas."}
          </p>
        ) : shown.length === 0 ? (
          <p className="px-2 py-6 text-xs text-neutral-500">No areas found</p>
        ) : (
          <ol className="flex flex-col">
            {shown.map((row) => {
              const isSelected = row.code === selectedCode;
              return (
                <li key={row.code} ref={isSelected ? selectedRef : undefined}>
                  <button
                    type="button"
                    title={`Go to ${row.name}`}
                    onClick={() => {
                      goToArea({
                        code: row.code,
                        name: row.name,
                        areaSetCode,
                      });
                      onGoTo();
                    }}
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-[2rem_minmax(0,1fr)_4rem_3.5rem] items-center gap-2 rounded-md px-2 py-1 text-left text-xs",
                      isSelected
                        ? "bg-neutral-100 font-medium"
                        : "hover:bg-neutral-100",
                    )}
                  >
                    <span className="text-right text-[11px] tabular-nums text-neutral-400">
                      {ranked.isNumeric && row.number !== null ? row.rank : ""}
                    </span>
                    <span className="truncate">{row.name}</span>
                    <span className="h-1 overflow-hidden rounded-full bg-neutral-100">
                      {row.number !== null && (
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.max(0, ((row.number - Math.min(ranked.min, 0)) / span) * 100)}%`,
                            backgroundColor: INK,
                            opacity: isSelected ? 1 : 0.55,
                          }}
                        />
                      )}
                    </span>
                    <span className="text-right tabular-nums">
                      {format(row)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
