"use client";

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as turfLib from "@turf/turf";
import { ArrowUpDown, ChevronDown, X } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { mapColors } from "@/app/(private)/map/[id]/styles";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Slider } from "@/shadcn/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { Toggle } from "@/shadcn/ui/toggle";
import { MapContext } from "../../context/MapContext";

interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  selectedRecordId?: string;
  onClose?: () => void;
  title?: string;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  onRowClick,
  selectedRecordId,
  onClose,
  title,
}: DataTableProps<TData, TValue>) {
  const {
    placedMarkers,
    selectedMarkerId,
    setSelectedMarkerId,
    radiusMiles,
    setRadiusMiles,
    mapRef,
    turfs,
  } = useContext(MapContext);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showMarkerFilter, setShowMarkerFilter] = useState(false);
  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const [selectedTurfId, setSelectedTurfId] = useState<string | null>(null);

  // Get available markers from both placed markers and data source markers
  const availableMarkers = useMemo(() => {
    const markers: {
      id: string;
      name: string;
      coordinates: [number, number];
      type: "placed" | "data";
    }[] = [];

    // Add placed markers only
    placedMarkers.forEach((marker) => {
      markers.push({
        id: `placed-${marker.id}`,
        name: marker.label,
        coordinates: [marker.point.lng, marker.point.lat],
        type: "placed",
      });
    });

    return markers;
  }, [placedMarkers]);

  // Handle marker selection with flyTo effect
  const handleMarkerSelect = (markerId: string) => {
    setSelectedMarkerId(markerId);

    // Find the selected marker and fly to it
    const selectedMarker = availableMarkers.find((m) => m.id === markerId);
    if (selectedMarker && mapRef?.current) {
      mapRef.current.flyTo({
        center: selectedMarker.coordinates,
        zoom: 9,
        duration: 1000,
      });
    }
  };

  // Filter data based on distance from selected marker and/or selected turf area
  const filteredData = useMemo(() => {
    let filtered = data;

    // Filter by marker radius (only if toggle is active)
    if (showMarkerFilter && selectedMarkerId && radiusMiles) {
      const selectedMarker = availableMarkers.find(
        (m) => m.id === selectedMarkerId
      );
      if (selectedMarker) {
        filtered = filtered.filter(
          (row: TData & { geocodePoint?: { lat: number; lng: number } }) => {
            if (!row.geocodePoint) return false;

            const distance = calculateDistance(
              selectedMarker.coordinates[1], // lat
              selectedMarker.coordinates[0], // lng
              row.geocodePoint.lat,
              row.geocodePoint.lng
            );

            return distance <= radiusMiles;
          }
        );
      }
    }

    // Filter by turf area (only if toggle is active)
    if (showAreaFilter && selectedTurfId) {
      const selectedTurf = turfs.find((t) => t.id === selectedTurfId);
      if (selectedTurf) {
        filtered = filtered.filter(
          (row: TData & { geocodePoint?: { lat: number; lng: number } }) => {
            if (!row.geocodePoint) return false;

            const point = turfLib.point([
              row.geocodePoint.lng,
              row.geocodePoint.lat,
            ]);
            return turfLib.booleanPointInPolygon(point, selectedTurf.geometry);
          }
        );
      }
    }

    return filtered;
  }, [
    data,
    showMarkerFilter,
    selectedMarkerId,
    radiusMiles,
    availableMarkers,
    showAreaFilter,
    selectedTurfId,
    turfs,
  ]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: "includesString",
    state: {
      globalFilter,
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-1">
        <div className="flex items-center gap-4">
          {title && (
            <div className="flex flex-row gap-2">
              <p className="font-bold whitespace-nowrap">{title}</p>
            </div>
          )}
          <Input
            placeholder="Filter all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm shadow-none"
          />
          <div className="flex items-center gap-2 text-sm">
            <p className="whitespace-nowrap">Filter by</p>
            <Toggle
              variant="outline"
              size="sm"
              pressed={showMarkerFilter}
              onPressedChange={setShowMarkerFilter}
              className="shadow-none gap-1"
            >
              <span className="font-normal">Proximity to</span>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: mapColors.markers.color }}
              />
              Marker
            </Toggle>
            <Toggle
              variant="outline"
              size="sm"
              pressed={showAreaFilter}
              onPressedChange={setShowAreaFilter}
              className="shadow-none gap-1"
            >
              <span className="font-normal">Is Within</span>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: mapColors.areas.color }}
              />
              Area
            </Toggle>
          </div>
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

      {/* Distance Filter Controls */}
      {showMarkerFilter && (
        <div className="flex items-center gap-4 p-2 bg-neutral-50 rounded-md">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Marker:</label>
            <Select
              value={selectedMarkerId || ""}
              onValueChange={handleMarkerSelect}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a marker" />
              </SelectTrigger>
              <SelectContent>
                {availableMarkers.map((marker) => (
                  <SelectItem key={marker.id} value={marker.id}>
                    {marker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Radius:</label>
            <div className="flex items-center gap-2 w-32">
              <Slider
                value={[radiusMiles]}
                onValueChange={(value) => setRadiusMiles(value[0])}
                max={50}
                min={1}
                step={0.5}
                className="w-20"
                trackBackground="bg-neutral-300"
              />
              <span className="text-sm w-8 whitespace-nowrap">
                {radiusMiles} mi
              </span>
            </div>
          </div>

          {selectedMarkerId && (
            <div className="text-sm text-neutral-600">
              Showing {filteredData.length} of {data.length} records
            </div>
          )}
        </div>
      )}

      {/* Area Filter Controls */}
      {showAreaFilter && (
        <div className="flex items-center gap-4 p-2 bg-neutral-50 rounded-md">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Area:</label>
            <Select
              value={selectedTurfId || ""}
              onValueChange={setSelectedTurfId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a turf area" />
              </SelectTrigger>
              <SelectContent>
                {turfs.map((turf) => (
                  <SelectItem key={turf.id} value={turf.id}>
                    {turf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTurfId && (
            <div className="text-sm text-neutral-600">
              Showing {filteredData.length} of {data.length} records
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border bg-white overflow-clip">
        <Table>
          <TableHeader className="bg-neutral-100 ">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center">
                          <div
                            onClick={() =>
                              header.column.getToggleSortingHandler()?.(false)
                            }
                            className="flex cursor-pointer items-center h-8 p-0 hover:bg-transparent group"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 transition group-hover:opacity-100" />
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
            {table.getRowModel().rows?.length ? (
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
                        cell.getContext()
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
    </div>
  );
}
