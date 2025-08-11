"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Filter,
  ListFilter,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useContext, useState } from "react";
import { ColumnDef, DataRecord, SortInput } from "@/__generated__/types";
import { DATA_RECORDS_PAGE_SIZE } from "@/constants";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import mapStyles, { mapColors } from "../../styles";

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewActiveFilters, setViewActiveFilters] = useState(false);

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
          c.name === columnName ? { name: columnName, desc: true } : c
        )
      );
    }
  };

  const handleSearch = () => {
    // TODO: Implement server-side search
    console.log("Searching for:", filter);
  };

  return (
    <div className="flex flex-col  h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-4">
          {title && (
            <div className="flex flex-row gap-2 text-sm">
              <p className="font-semibold whitespace-nowrap">{title}</p>
              {recordCount !== undefined && <p>{recordCount}</p>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={filter ?? ""}
                  onChange={(event) => setFilter(event.target.value)}
                  className="pl-8 w-48 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button size="sm" onClick={handleSearch} className="text-xs">
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
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <AdvancedFilters />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="table"
              className="ml-auto shadow-none"
            >
              Display <Settings2 className="text-muted-foreground" />
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
                        hiddenColumns.filter((c) => c !== column.name)
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
      </div>
      <div className="  bg-white grow min-h-0">
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
                        {String(row.json[column.name] || "-")}
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

function AdvancedFilters() {
  const { turfs, placedMarkers } = useContext(MarkerAndTurfContext);
  const [selectedFilters, setSelectedFilters] = useState<
    Array<{
      id: string;
      type: "marker" | "area" | "field";
      label: string;
      value: string;
    }>
  >([]);

  const handleFilterChange = (
    type: "marker" | "area" | "field",
    id: string,
    label: string,
    value: string
  ) => {
    const filterId = `${type}_${id}`;
    const exists = selectedFilters.find((f) => f.id === filterId);

    if (!exists) {
      setSelectedFilters((prev) => [
        ...prev,
        {
          id: filterId,
          type,
          label,
          value,
        },
      ]);
    }
  };

  const removeFilter = (filterId: string) => {
    setSelectedFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  // Filter out the members data source from the general data sources

  const columnItems = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Address",
      value: "address",
    },
    {
      label: "Constituency",
      value: "constituency",
    },
    {
      label: "RSVP",
      value: "rsvp",
    },
  ];

  return (
    <div className="flex  gap-2">
      {/* Filter Chips */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 ">
          {selectedFilters.map((filter) => (
            <div
              key={filter.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                filter.type === "marker"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : filter.type === "area"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  filter.type === "marker"
                    ? "bg-red-500"
                    : filter.type === "area"
                      ? "bg-green-500"
                      : "bg-blue-500"
                }`}
              />
              {filter.label}
              <button
                onClick={() => removeFilter(filter.id)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="table"
            className="ml-auto shadow-none"
          >
            <ListFilter className="text-muted-foreground" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="right">
          <DropdownMenuLabel>Filter by Layer</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <div
                className="h-3 w-3 rounded-full mr-2"
                style={{
                  backgroundColor: mapColors.markers.color,
                }}
              />
              Proximity to Marker
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {/* Markers */}
              {placedMarkers.length > 0 && (
                <>
                  {placedMarkers.map((ds) => (
                    <DropdownMenuItem
                      key={`markers_${ds.id}`}
                      className="flex items-center gap-1 text-xs"
                      onClick={() =>
                        handleFilterChange(
                          "marker",
                          ds.id,
                          ds.label,
                          `Within 5 miles of ${ds.label}`
                        )
                      }
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: mapColors.markers.color,
                        }}
                      />
                      {ds.label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <div
                className="h-3 w-3 rounded-full mr-2"
                style={{
                  backgroundColor: mapColors.areas.color,
                }}
              />
              Within Area
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {/* Areas */}
              {turfs.length > 0 && (
                <>
                  {turfs.map((turf) => (
                    <DropdownMenuItem
                      key={`turf_${turf.id}`}
                      className="flex items-center gap-1 text-xs"
                      onClick={() =>
                        handleFilterChange(
                          "area",
                          turf.id,
                          turf.label,
                          `Within ${turf.label}`
                        )
                      }
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: mapColors.areas.color,
                        }}
                      />
                      {turf.label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Filter by Field</DropdownMenuLabel>
          {columnItems.map((item) => (
            <DropdownMenuItem
              key={item.value}
              onClick={() =>
                handleFilterChange(
                  "field",
                  item.value,
                  item.label,
                  `${item.label} is Yes`
                )
              }
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
