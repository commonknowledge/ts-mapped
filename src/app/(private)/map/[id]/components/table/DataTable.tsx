"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ValueBadge from "@/components/ValueBadge";
import { DATA_RECORDS_PAGE_SIZE } from "@/constants";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import BooleanValueDisplay from "../BooleanValueDisplay";
import MarkerShapeIcon from "../MarkerShapeIcon";
import type { DataRecord } from "@/models/DataRecord";
import type { ColumnDef } from "@/models/DataSource";
import type { SortInput } from "@/models/MapView";
import type { ReactNode } from "react";

interface DataTableProps {
  title?: string;
  buttons: ReactNode;

  loading: boolean;
  columns: ColumnDef[];
  data: DataRecord[];
  recordCount?: {
    total: number;
    matched: number;
  };

  pageIndex: number;
  setPageIndex: (page: number) => void;
  sort: SortInput[];
  setSort: (sort: SortInput[]) => void;

  onRowClick?: (row: DataRecord) => void;
  selectedRecordId?: string;

  onClose?: () => void;
  filter?: ReactNode;
  highlightedColumns?: Set<string>;
  /** Colour for a cell value (e.g. from column valueColors); when returned,
   *  the cell renders as a coloured badge instead of plain text. */
  getCellColor?: (input: {
    columnName: string;
    value: unknown;
  }) => string | undefined;
  /** Marker icon shape for a cell value (the map's icon column); when
   *  returned, the shape glyph renders before the value. */
  getCellShape?: (input: {
    columnName: string;
    value: unknown;
  }) => string | undefined;
  /** Clamped 0-100 percentage (semantic type already applied) for cells of
   *  Percentage-formatted columns; when returned, a mini bar renders. */
  getCellPercentage?: (input: {
    columnName: string;
    value: unknown;
  }) => { percent: number; barColor?: string } | undefined;
  /** Filled/max segment counts for cells of Scale-formatted columns; when
   *  returned, a segmented rating renders. */
  getCellScale?: (input: {
    columnName: string;
    value: unknown;
  }) => { filled: number; max: number; barColor?: string } | undefined;
  /** Columns with the Boolean inspector display format render as yes/no */
  booleanColumns?: Set<string>;
  /** Custom cell text (e.g. pretty-printed dates); falls back to the
   *  default rendering when undefined is returned. */
  getCellText?: (input: {
    columnName: string;
    value: unknown;
  }) => string | undefined;
}

export function DataTable({
  title,
  buttons,

  loading,
  columns,
  data,
  recordCount,

  pageIndex,
  setPageIndex,
  sort,
  setSort,

  onRowClick,
  selectedRecordId,
  onClose,

  filter,
  highlightedColumns,
  getCellColor,
  getCellShape,
  getCellPercentage,
  getCellScale,
  booleanColumns,
  getCellText,
}: DataTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const lastPageIndex = Math.max(
    Math.ceil((recordCount?.matched || 0) / DATA_RECORDS_PAGE_SIZE) - 1,
    0,
  );

  const getSortIcon = (columnName: string) => {
    const state = sort.find((c) => c.name === columnName);
    if (!state) {
      return (
        <ArrowUpDown className="size-3.5 opacity-0 group-hover:opacity-100" />
      );
    }
    if (state.desc) {
      return <ArrowDown className="size-3.5 text-neutral-900" />;
    }
    return <ArrowUp className="size-3.5 text-neutral-900" />;
  };

  const onClickSort = (columnName: string) => {
    const state = sort.find((c) => c.name === columnName);
    if (!state) {
      setSort([...sort, { name: columnName, desc: false }]);
    } else if (state.desc) {
      setSort(sort.filter((c) => c.name !== columnName));
    } else {
      setSort(
        sort.map((c) =>
          c.name === columnName ? { name: columnName, desc: true } : c,
        ),
      );
    }
  };
  useEffect(() => {
    if (
      !selectedRecordId ||
      !tableContainerRef.current ||
      !data?.length ||
      loading
    )
      return;

    const container = tableContainerRef.current;
    const row = container.querySelector<HTMLTableRowElement>(
      `tr[data-state="selected"]`,
    );

    if (!row) return;

    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    const isInView =
      rowRect.top >= containerRect.top &&
      rowRect.bottom <= containerRect.bottom;

    // check if the row is in view to avoid scrolling to it on user click on table row
    if (!isInView) {
      row.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedRecordId, data, loading]);

  return (
    <div className="flex flex-col h-full bg-white" ref={tableContainerRef}>
      <div className="flex min-h-11 items-center gap-3 border-b border-neutral-200 px-3 py-2">
        {title && (
          <div className="flex shrink-0 items-baseline gap-1.5">
            <p className="max-w-[220px] truncate text-sm font-medium text-neutral-900">
              {title}
            </p>
            {recordCount && (
              <span className="text-xs text-neutral-500 tabular-nums">
                {recordCount.total !== recordCount.matched
                  ? `${recordCount.matched.toLocaleString()} of ${recordCount.total.toLocaleString()}`
                  : recordCount.matched.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {filter && <div className="min-w-0 flex-1">{filter}</div>}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 [&_button]:h-7 [&_button]:text-xs">
          {buttons}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 px-2 font-normal"
              >
                <Settings2 className="size-3.5 text-neutral-500" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.name}
                    checked={!hiddenColumns.includes(column.name)}
                    onCheckedChange={(visible) => {
                      if (visible) {
                        setHiddenColumns(
                          hiddenColumns.filter((c) => c !== column.name),
                        );
                      } else {
                        setHiddenColumns([...hiddenColumns, column.name]);
                      }
                    }}
                  >
                    {column.name}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close table"
              className="w-7 text-neutral-500"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="grow min-h-0 flex flex-col">
        <div className="bg-white grow min-h-0">
          <Table
            containerClassName="h-full overflow-y-auto"
            className="text-xs [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3 [&_tr]:border-neutral-100"
          >
            {/* z-[1]: above cell content whose transforms (e.g. badge swatch
                dots) create layer-0 stacking contexts that would paint over
                the header, but below the map overlay panels (inspector etc.),
                which sit at z-10 in the same stacking context */}
            <TableHeader className="bg-neutral-50 sticky top-0 z-[1] shadow-[inset_0_-1px_0_#e5e5e5]">
              <TableRow className="hover:bg-transparent">
                {columns
                  .filter((c) => !hiddenColumns.includes(c.name))
                  .map((column) => {
                    return (
                      <TableHead
                        key={column.name}
                        className={cn(
                          "h-8 font-medium text-neutral-500",
                          highlightedColumns?.has(column.name) && "bg-blue-50",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onClickSort(column.name)}
                          className="group flex cursor-pointer items-center gap-1 hover:text-neutral-900"
                        >
                          {column.name}
                          <span className="size-3.5">
                            {getSortIcon(column.name)}
                          </span>
                        </button>
                      </TableHead>
                    );
                  })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-neutral-500"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : data.length ? (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.id === selectedRecordId && "selected"}
                    onClick={() => onRowClick?.(row)}
                    className="cursor-pointer text-neutral-700 hover:bg-neutral-50 data-[state=selected]:bg-neutral-100 data-[state=selected]:text-neutral-900"
                  >
                    {columns
                      .filter((c) => !hiddenColumns.includes(c.name))
                      .map((column) => {
                        const value = row.json[column.name];
                        const cellColor = getCellColor?.({
                          columnName: column.name,
                          value,
                        });
                        const shape = getCellShape?.({
                          columnName: column.name,
                          value,
                        });
                        const percentage = getCellPercentage?.({
                          columnName: column.name,
                          value,
                        });
                        const scale = getCellScale?.({
                          columnName: column.name,
                          value,
                        });
                        const text =
                          getCellText?.({ columnName: column.name, value }) ??
                          renderCell(value);
                        const content = cellColor ? (
                          <ValueBadge color={cellColor}>{text}</ValueBadge>
                        ) : (
                          text
                        );
                        return (
                          <TableCell
                            key={column.name}
                            className={
                              highlightedColumns?.has(column.name)
                                ? "whitespace-normal bg-blue-50"
                                : "whitespace-normal"
                            }
                          >
                            {shape ? (
                              <span className="inline-flex items-center gap-1.5">
                                <MarkerShapeIcon
                                  shape={shape}
                                  color={cellColor ?? "#404040"}
                                />
                                {content}
                              </span>
                            ) : booleanColumns?.has(column.name) ? (
                              <BooleanValueDisplay value={value} />
                            ) : percentage ? (
                              <span
                                className="inline-flex items-center gap-2"
                                title={`${percentage.percent.toFixed(0)}%`}
                              >
                                <span className="h-2 w-16 rounded-full bg-neutral-200 overflow-hidden shrink-0">
                                  <span
                                    className="block h-full rounded-full"
                                    style={{
                                      width: `${percentage.percent}%`,
                                      backgroundColor:
                                        percentage.barColor?.trim()
                                          ? percentage.barColor
                                          : "var(--primary)",
                                    }}
                                  />
                                </span>
                                <span className="text-xs font-medium tabular-nums shrink-0">
                                  {percentage.percent.toFixed(0)}%
                                </span>
                              </span>
                            ) : scale ? (
                              <span
                                className="inline-flex items-center gap-1"
                                title={`${scale.filled} / ${scale.max}`}
                              >
                                {Array.from({ length: scale.max }, (_, i) => (
                                  <span
                                    key={i}
                                    className="h-2 w-2 rounded-sm bg-neutral-200 shrink-0"
                                    style={
                                      i < scale.filled
                                        ? {
                                            backgroundColor:
                                              scale.barColor?.trim()
                                                ? scale.barColor
                                                : "var(--primary)",
                                          }
                                        : undefined
                                    }
                                  />
                                ))}
                              </span>
                            ) : (
                              content
                            )}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-neutral-500"
                  >
                    No records match.
                  </TableCell>
                </TableRow>
              )}
              {lastPageIndex > 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="p-0">
                    <div className="flex items-center gap-1 px-3 py-2 text-xs text-neutral-500">
                      {[
                        {
                          label: "First page",
                          icon: <ChevronsLeft className="size-3.5" />,
                          page: 0,
                          disabled: pageIndex <= 0,
                        },
                        {
                          label: "Previous page",
                          icon: <ChevronLeft className="size-3.5" />,
                          page: pageIndex - 1,
                          disabled: pageIndex <= 0,
                        },
                      ].map(({ label, icon, page, disabled }) => (
                        <Button
                          key={label}
                          variant="ghost"
                          size="icon"
                          aria-label={label}
                          title={label}
                          onClick={() => setPageIndex(page)}
                          disabled={disabled}
                          className="size-7 text-neutral-500"
                        >
                          {icon}
                        </Button>
                      ))}
                      <span className="px-1 whitespace-nowrap tabular-nums">
                        Page {pageIndex + 1} of {lastPageIndex + 1}
                      </span>
                      {[
                        {
                          label: "Next page",
                          icon: <ChevronRight className="size-3.5" />,
                          page: pageIndex + 1,
                          disabled: pageIndex >= lastPageIndex,
                        },
                        {
                          label: "Last page",
                          icon: <ChevronsRight className="size-3.5" />,
                          page: lastPageIndex,
                          disabled: pageIndex >= lastPageIndex,
                        },
                      ].map(({ label, icon, page, disabled }) => (
                        <Button
                          key={label}
                          variant="ghost"
                          size="icon"
                          aria-label={label}
                          title={label}
                          onClick={() => setPageIndex(page)}
                          disabled={disabled}
                          className="size-7 text-neutral-500"
                        >
                          {icon}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

const renderCell = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(renderCell).join(", ");
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.every((k) => /^\d+$/.test(k) && Number(k) >= 0)) {
      return renderCell(Object.values(value));
    }
    return JSON.stringify(value);
  }
  return value ? String(value) : "-";
};
