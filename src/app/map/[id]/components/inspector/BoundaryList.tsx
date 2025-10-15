"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpDownIcon, Loader2Icon, Search, XIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { ChoroplethContext } from "@/app/map/[id]/context/ChoroplethContext";
import { InspectorContext } from "@/app/map/[id]/context/InspectorContext";
import { MapContext } from "@/app/map/[id]/context/MapContext";
import { useChoroplethDataSource } from "@/app/map/[id]/hooks/useDataSources";
import LayerIcon from "@/components/LayerIcon";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import { LayerType } from "@/types";
import type { AreaSetCode } from "@/server/models/AreaSet";

interface BoundaryFeature {
  id: number;
  name: string;
  code: string;
  areaSetCode: string;
  memberCount: number;
  markerCount: number;
}

export default function BoundaryList() {
  const { setInspectorContent, navigateToParent } =
    useContext(InspectorContext);
  const { choroplethLayerConfig } = useContext(ChoroplethContext);
  const { mapRef, mapId } = useContext(MapContext);
  const choroplethDataSource = useChoroplethDataSource();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<
    "name" | "memberCount" | "markerCount" | "membersAndMarkers"
  >("membersAndMarkers");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce search term - only search after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Extract the required properties from choroplethLayerConfig
  const {
    areaSetCode,
    mapbox: { sourceId, layerId, featureCodeProperty },
  } = choroplethLayerConfig;

  // Load boundaries from server with pagination
  const {
    data: boundaryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "area.listAll",
      areaSetCode,
      debouncedSearchTerm,
      currentPage,
      sortBy,
      sortOrder,
      choroplethDataSource?.id,
      mapId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        input: JSON.stringify({
          json: {
            areaSetCode: areaSetCode as AreaSetCode,
            searchTerm: debouncedSearchTerm.trim() || undefined,
            page: currentPage,
            pageSize: 50,
            sortBy,
            sortOrder,
            dataSourceId: choroplethDataSource?.id,
            mapId: mapId,
          },
        }),
      });

      const response = await fetch(`/api/trpc/area.listAll?${params}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch boundaries: ${response.status}`);
      }

      const result = (await response.json()) as {
        result: { data: { json: { areas: BoundaryFeature[]; total: number } } };
      };
      return result.result.data;
    },
    enabled: !!areaSetCode && !!choroplethDataSource?.id && !!mapId,
  });

  const boundaries = boundaryData?.json?.areas || [];
  const totalBoundaries = boundaryData?.json?.total || 0;
  const totalPages = Math.ceil(totalBoundaries / 50);

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  };

  // Reset page when debounced search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm]);

  // Handle sorting
  const handleSortChange = (
    newSortBy: "name" | "memberCount" | "markerCount" | "membersAndMarkers",
  ) => {
    if (sortBy === newSortBy) {
      // Only allow toggle for name column
      if (newSortBy === "name") {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      }
      // For count columns, do nothing when clicked again (always descending)
    } else {
      setSortBy(newSortBy);
      // Set default sort order based on column type
      if (newSortBy === "name") {
        setSortOrder("asc"); // Name defaults to ascending
      } else {
        setSortOrder("desc"); // Count columns always descending
      }
    }
    setCurrentPage(0); // Reset to first page when sorting
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBoundaryClick = (boundary: BoundaryFeature) => {
    if (!mapRef) {
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    const features = map.querySourceFeatures(sourceId, {
      sourceLayer: layerId,
      filter: ["==", featureCodeProperty, boundary.code],
    });

    if (features.length > 0) {
      const feature = features[0];

      // Get dataset name based on layer ID
      const getDatasetName = () => {
        if (layerId.includes("uk_cons")) return "Westminster Constituencies";
        if (layerId.includes("OA21")) return "Output Areas";
        if (layerId.includes("MSOA")) return "Middle Layer Super Output Areas";
        return "Boundary Data";
      };

      setInspectorContent({
        type: LayerType.Boundary,
        name: boundary.name,
        properties: {
          "Area Code": boundary.code,
          Dataset: getDatasetName(),
          areaCode: boundary.code,
          areaName: boundary.name,
        },
        dataSource: null,
        id: boundary.code,
        boundaryFeature: feature as unknown as Record<string, unknown>,
        parent: {
          type: LayerType.Boundary,
          name: "Boundaries",
          id: "boundaries-list",
        },
      });

      // Try to fly to the boundary using the feature bounds
      if (feature.bbox) {
        map.fitBounds(feature.bbox as [number, number, number, number], {
          padding: 50,
          duration: 1000,
        });
      }
    }
  };

  return (
    <div className="absolute top-0 bottom-0 right-4 / flex flex-col gap-6 w-60 pt-20 pb-5">
      <div className="relative z-10 w-full max-h-full overflow-auto / flex flex-col / rounded shadow-lg bg-white / text-sm font-sans group">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 p-3">
          <h1 className="grow flex items-center gap-2 / text-sm font-semibold">
            <LayerIcon type={LayerType.Boundary} />
            Boundaries
          </h1>
          <button
            className="cursor-pointer"
            aria-label="Close inspector panel"
            onClick={() => navigateToParent()}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              placeholder="Search boundaries..."
              className="text-xs! pl-8"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Boundaries List */}
        <div className="grow overflow-auto flex flex-col gap-4 [&:not(:empty)]:border-t [&:not(:empty)]:p-2">
          {error ? (
            <div className="p-4 text-xs text-center text-red-500">
              Error loading boundaries: {error.message}
            </div>
          ) : isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <div className=" text-center text-neutral-500 flex items-center gap-2 justify-center">
                <Loader2Icon className="size-4 animate-spin" />
                Loading boundaries...
              </div>
              <p className="text-xs text-center text-neutral-500">
                {" "}
                This may take a few seconds...
              </p>
            </div>
          ) : boundaries.length === 0 ? (
            <div className="p-4 text-center text-neutral-500">
              {debouncedSearchTerm
                ? "No boundaries found matching your search."
                : "No boundaries available."}
            </div>
          ) : (
            <div className="">
              {/* Dataset Name */}
              <div className="text-sm font-medium text-neutral-700 px-2 py-1">
                {(() => {
                  if (layerId?.includes("uk_cons"))
                    return "Westminster Constituencies";
                  if (layerId?.includes("OA21")) return "Output Areas";
                  if (layerId?.includes("MSOA"))
                    return "Middle Layer Super Output Areas";
                  return "Boundary Data";
                })()}
              </div>
              <div className="flex flex-col text-xs text-neutral-500 px-2 py-0">
                <div>
                  {totalBoundaries} boundar{totalBoundaries !== 1 ? "ies" : "y"}
                </div>

                {/* Sorting Controls */}
                <div className=" py-1 flex-1">
                  <Select
                    value={sortBy}
                    onValueChange={(
                      value:
                        | "name"
                        | "memberCount"
                        | "markerCount"
                        | "membersAndMarkers",
                    ) => handleSortChange(value)}
                  >
                    <SelectTrigger className="w-full text-xs " size="sm">
                      <ArrowUpDownIcon className="size-3" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <Label className="text-xs text-neutral-500 p-1">
                        Sort by
                      </Label>
                      <SelectItem value="membersAndMarkers">
                        Members & Markers
                      </SelectItem>
                      <SelectItem value="memberCount">Members</SelectItem>
                      <SelectItem value="markerCount">Markers</SelectItem>
                      <SelectItem value="name">
                        Name{" "}
                        {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {boundaries.map((boundary: BoundaryFeature) => (
                <button
                  key={boundary.id}
                  onClick={() => handleBoundaryClick(boundary)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 rounded-md transition-colors",
                    "group",
                  )}
                >
                  <LayerIcon type={LayerType.Boundary} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {boundary.name}
                    </div>
                    <div className="text-xs text-neutral-400 flex gap-3 ">
                      <span>{boundary.memberCount} members</span>
                      <span>{boundary.markerCount} markers</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-2 border-t bg-neutral-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  currentPage === 0
                    ? "text-neutral-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-800",
                )}
              >
                ← Previous
              </button>

              <span className="text-xs text-neutral-500">
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  currentPage >= totalPages - 1
                    ? "text-neutral-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-800",
                )}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
