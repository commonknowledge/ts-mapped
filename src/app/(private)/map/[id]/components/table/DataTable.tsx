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
        <ArrowUpDown className="opacity-0 group-hover:opacity-100 h-4 w-4" />
      );
    }
    if (state.desc) {
      return <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUp className="h-4 w-4" />;
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
    <div className="flex flex-col h-full" ref={tableContainerRef}>
      <div className="flex items-center justify-between px-3 py-2 border-b h-12">
        <div className="flex items-center gap-4">
          {title && (
            <div className="flex flex-row gap-2">
              <p className="font-bold whitespace-nowrap">{title}</p>
              {recordCount && <span>{recordCount?.matched}</span>}
              {recordCount && recordCount.total !== recordCount.matched && (
                <span>{`(${recordCount.total})`}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {buttons}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="text-muted-foreground" />
                Display
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
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      <div className="grow min-h-0 flex flex-col ">
        <div className="flex items-center gap-2 px-3 py-2 border-b justify-between">
          {filter}
        </div>
        <div className="bg-white grow min-h-0">
          <Table containerClassName="h-full overflow-y-auto">
            {/* z-[1]: above cell content whose transforms (e.g. badge swatch
                dots) create layer-0 stacking contexts that would paint over
                the header, but below the map overlay panels (inspector etc.),
                which sit at z-10 in the same stacking context */}
            <TableHeader className="bg-neutral-100 sticky top-0 z-[1]">
              <TableRow>
                {columns
                  .filter((c) => !hiddenColumns.includes(c.name))
                  .map((column) => {
                    return (
                      <TableHead
                        key={column.name}
                        className={
                          highlightedColumns?.has(column.name)
                            ? "bg-blue-50"
                            : undefined
                        }
                      >
                        <div className="flex items-center">
                          <div
                            onClick={() => onClickSort(column.name)}
                            className="flex cursor-pointer items-center h-8 p-0 hover:bg-transparent group"
                          >
                            {column.name}
                            <span className="ml-2 h-4 w-4">
                              {getSortIcon(column.name)}
                            </span>
                          </div>
                        </div>
                      </TableHead>
                    );
                  })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell>Loading...</TableCell>
                </TableRow>
              ) : data.length ? (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.id === selectedRecordId && "selected"}
                    onClick={() => onRowClick?.(row)}
                    //this feels wrong also it needs to be blue if its a selected member, but in the future, red if its a selected markers
                    className={`cursor-pointer hover:bg-neutral-50 data-[state=selected]:bg-blue-50`}
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
                        const text = renderCell(value);
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
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
              {lastPageIndex > 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <div className="flex items-center gap-2 p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(0)}
                        disabled={pageIndex <= 0}
                        className="text-muted-foreground font-normal"
                      >
                        <ChevronsLeft className="w-4 h-4" /> First Page
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(pageIndex - 1)}
                        disabled={pageIndex <= 0}
                        className="text-muted-foreground font-normal"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous Page
                      </Button>
                      <span className="text-muted-foreground font-normal whitespace-nowrap">
                        Page {pageIndex + 1} of {lastPageIndex + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(pageIndex + 1)}
                        disabled={pageIndex >= lastPageIndex}
                        className="text-muted-foreground font-normal"
                      >
                        <ChevronRight className="w-4 h-4" /> Next Page
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(lastPageIndex)}
                        disabled={pageIndex >= lastPageIndex}
                        className="text-muted-foreground font-normal"
                      >
                        <ChevronsRight className="w-4 h-4" /> Last Page
                      </Button>
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
