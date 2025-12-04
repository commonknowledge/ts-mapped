"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DATA_RECORDS_PAGE_SIZE } from "@/constants";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import type { DataRecord } from "@/server/models/DataRecord";
import type { ColumnDef } from "@/server/models/DataSource";
import type { SortInput } from "@/server/models/MapView";
import type { ReactNode } from "react";

interface DataTableProps {
  title?: string;
  buttons: ReactNode;

  loading: boolean;
  columns: ColumnDef[];
  data: DataRecord[];
  recordCount?: {
    count: number;
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
  search?: string;
  setSearch?: (search: string) => void;
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
  search,
  setSearch,
}: DataTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
              {recordCount && recordCount.count !== recordCount.matched && (
                <span>{`(${recordCount.count})`}</span>
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
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={search ?? ""}
                  onChange={(event) =>
                    setSearch ? setSearch(event.target.value) : null
                  }
                  className="pl-8 w-48 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsSearchOpen(false);
                    }
                  }}
                />
              </div>
              <Button
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs"
              >
                Search
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="text-xs"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
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
            <TableHeader className="bg-neutral-100 sticky top-0">
              <TableRow>
                {columns
                  .filter((c) => !hiddenColumns.includes(c.name))
                  .map((column) => {
                    return (
                      <TableHead key={column.name}>
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
                      .map((column) => (
                        <TableCell
                          key={column.name}
                          className="whitespace-normal"
                        >
                          {renderCell(row.json[column.name])}
                        </TableCell>
                      ))}
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
