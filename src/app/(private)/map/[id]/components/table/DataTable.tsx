"use client";

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, X } from "lucide-react";
import { useState } from "react";
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

interface DataTableProps<TData extends { id: string }, TValue> {
  title?: string;

  loading: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  recordCount?: number | null | undefined;

  filter: string;
  setFilter: (filter: string) => void;
  pageIndex: number;
  setPageIndex: (page: number) => void;
  sort: SortingState;
  setSort: (sort: SortingState) => void;

  onRowClick?: (row: TData) => void;
  selectedRecordId?: string;

  onClose?: () => void;
}

export function DataTable<TData extends { id: string }, TValue>({
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
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setFilter,
    onSortingChange: (change) => {
      const nextSort =
        typeof change === "function"
          ? (change as (prevState: SortingState) => SortingState)(sort)
          : change;
      setSort(nextSort);
    },
    enableSortingRemoval: true,
    rowCount: recordCount || -1,
    state: {
      sorting: sort,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize: DATA_RECORDS_PAGE_SIZE,
      },
    },
  });

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
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center">
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex cursor-pointer items-center h-8 p-0 hover:bg-transparent group"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}

                            {header.column.getCanSort() && (
                              <span className="ml-2 h-4 w-4">
                                {
                                  {
                                    asc: <ArrowUp className="h-4 w-4" />,
                                    desc: <ArrowDown className="h-4 w-4" />,
                                    false: (
                                      <ArrowUpDown className="opacity-0 group-hover:opacity-100 h-4 w-4" />
                                    ),
                                  }[
                                    (header.column.getIsSorted() as string) ||
                                      "false"
                                  ]
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="text-center">Loading...</TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  //this feels wrong also it needs to be blue if its a selected member, but in the future, red if its a selected markers
                  className={`cursor-pointer hover:bg-neutral-50 ${selectedRecordId === (row.original as unknown as { id: string })?.id ? "bg-blue-50" : ""} `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
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
        <Button
          onClick={() => setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </Button>
        <Button
          onClick={() => setPageIndex(pageIndex - 1)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </Button>
        <Button
          onClick={() => setPageIndex(pageIndex + 1)}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </Button>
        <Button
          onClick={() =>
            setPageIndex(
              Math.floor((recordCount || 0) / DATA_RECORDS_PAGE_SIZE),
            )
          }
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </Button>
      </div>
    </div>
  );
}
