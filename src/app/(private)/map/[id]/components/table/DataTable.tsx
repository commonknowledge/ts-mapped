"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { ColumnDef, DataRecord, SortInput } from "@/__generated__/types";
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

interface DataTableProps {
  title?: string;

  loading: boolean;
  columns: ColumnDef[];
  data: DataRecord[];
  recordCount?: number | null | undefined;

  filter: string;
  setFilter: (filter: string) => void;
  pageIndex: number;
  setPageIndex: (page: number) => void;
  sort: SortInput[];
  setSort: (sort: SortInput[]) => void;

  onRowClick?: (row: DataRecord) => void;
  selectedRecordId?: string;

  onClose?: () => void;
}

export function DataTable({
  title,

  loading,
  columns,
  data,
  recordCount,

  filter,
  setFilter,
  pageIndex,
  setPageIndex,
  sort,
  setSort,

  onRowClick,
  selectedRecordId,
  onClose,
}: DataTableProps) {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const lastPageIndex = Math.floor((recordCount || 0) / DATA_RECORDS_PAGE_SIZE);

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

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between p-1">
        <div className="flex items-center gap-4">
          {title && (
            <div className="flex flex-row gap-2">
              <p className="font-bold whitespace-nowrap">{title}</p>
              {recordCount !== undefined && <p>{recordCount}</p>}
            </div>
          )}
          <Input
            placeholder="Filter all columns..."
            value={filter ?? ""}
            onChange={(event) => setFilter(event.target.value)}
            className="max-w-sm shadow-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto shadow-none">
                Columns <ChevronDown />
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
            <X className="w-4 h-4 cursor-pointer" onClick={onClose} />
          )}
        </div>
      </div>
      <div className="rounded-md border bg-white grow min-h-0">
        <Table containerClassName="h-full">
          <TableHeader className="bg-neutral-100 ">
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
                  className={`cursor-pointer hover:bg-neutral-50 ${selectedRecordId === row.id ? "bg-blue-50" : ""}`}
                >
                  {columns
                    .filter((c) => !hiddenColumns.includes(c.name))
                    .map((column) => (
                      <TableCell key={column.name}>
                        {String(row.json[column.name])}
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
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button onClick={() => setPageIndex(0)} disabled={pageIndex <= 0}>
          {"<<"}
        </Button>
        <Button
          onClick={() => setPageIndex(pageIndex - 1)}
          disabled={pageIndex <= 0}
        >
          {"<"}
        </Button>
        <Button
          onClick={() => setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= lastPageIndex}
        >
          {">"}
        </Button>
        <Button
          onClick={() => setPageIndex(lastPageIndex)}
          disabled={pageIndex >= lastPageIndex}
        >
          {">>"}
        </Button>
      </div>
    </div>
  );
}
