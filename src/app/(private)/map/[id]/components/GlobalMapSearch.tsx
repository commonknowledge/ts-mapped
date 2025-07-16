"use client";

import * as turfLib from "@turf/turf";
import { Command, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { createPortal } from "react-dom";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { useDebounce } from "@/hooks";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { mapColors } from "../styles";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "geocoder" | "marker" | "area";
  coordinates?: [number, number];
  properties?: Record<string, unknown>;
}

interface GroupedResults {
  geocoder: SearchResult[];
  markers: SearchResult[];
  areas: SearchResult[];
}

interface MapboxSearchFeature {
  id: string;
  name: string;
  full_address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  feature_type: string;
  maki: string;
  metadata: Record<string, unknown>;
}

export default function GlobalMapSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedResults>({
    geocoder: [],
    markers: [],
    areas: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const {
    mapRef,
    insertPlacedMarker,
    setSelectedMarker,
    placedMarkers,
    turfs,
    markerQueries,
  } = useContext(MapContext);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }

      if (!isOpen) return;

      const allResults = [
        ...results.geocoder,
        ...results.markers,
        ...results.areas,
      ];

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : 0
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allResults.length - 1
        );
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const selectedResult = allResults[selectedIndex];
        if (selectedResult) {
          handleResultSelect(selectedResult);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Search functionality
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ geocoder: [], markers: [], areas: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    performSearch(debouncedQuery);
  }, [debouncedQuery]);

  const performSearch = useCallback(async (searchQuery: string) => {
    const query = searchQuery.toLowerCase();
    const newResults: GroupedResults = {
      geocoder: [],
      markers: [],
      areas: [],
    };

    try {
      // Real Mapbox Search Box API
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (mapboxToken && searchQuery.trim()) {
        const response = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
            searchQuery
          )}&access_token=${mapboxToken}&country=gb&limit=5&types=place,address,poi`
        );

        if (response.ok) {
          const data = await response.json();
          const geocoderResults: SearchResult[] = data.suggestions.map(
            (feature: MapboxSearchFeature, index: number) => ({
              id: `geo-${index}`,
              title: feature.name,
              subtitle: feature.full_address,
              type: "geocoder" as const,
              coordinates: [
                feature.coordinates.longitude,
                feature.coordinates.latitude,
              ] as [number, number],
              properties: {
                featureType: feature.feature_type,
                maki: feature.maki,
                metadata: feature.metadata,
              },
            })
          );
          newResults.geocoder = geocoderResults;
        }
      }

      // Real marker results from placedMarkers
      const markerResults: SearchResult[] = placedMarkers
        .filter(
          (marker) =>
            marker.label.toLowerCase().includes(query) ||
            marker.notes?.toLowerCase().includes(query)
        )
        .map((marker) => ({
          id: marker.id,
          title: marker.label,
          subtitle: marker.notes || "Placed marker",
          type: "marker" as const,
          coordinates: [marker.point.lng, marker.point.lat] as [number, number],
          properties: { source: "placed" },
        }));

      // Add data source markers if available
      if (markerQueries?.data) {
        markerQueries.data.forEach((dataSource) => {
          const dataSourceMarkers = dataSource.markers.features
            .filter((feature) => {
              const properties = feature.properties || {};
              const searchableText = [
                properties.name || "",
                properties.label || "",
                properties.address || "",
                properties.description || "",
                ...Object.values(properties).map(String),
              ]
                .join(" ")
                .toLowerCase();
              return searchableText.includes(query);
            })
            .map((feature) => ({
              id: `${dataSource.dataSourceId}-${feature.properties?.id || Math.random()}`,
              title:
                feature.properties?.name ||
                feature.properties?.label ||
                "Unnamed marker",
              subtitle: `${dataSource.dataSourceName} • ${feature.properties?.address || ""}`,
              type: "marker" as const,
              coordinates: feature.geometry.coordinates as [number, number],
              properties: {
                source: "dataSource",
                dataSourceId: dataSource.dataSourceId,
                dataSourceName: dataSource.dataSourceName,
                ...feature.properties,
              },
            }));
          markerResults.push(...dataSourceMarkers);
        });
      }

      newResults.markers = markerResults;

      // Real area results from turfs
      const areaResults: SearchResult[] = turfs
        .filter(
          (turf) =>
            turf.label.toLowerCase().includes(query) ||
            turf.notes?.toLowerCase().includes(query)
        )
        .map((turf) => {
          const center = turfLib.center(turf.geometry);
          return {
            id: turf.id,
            title: turf.label,
            subtitle: turf.notes || `Area: ${turf.area.toFixed(2)}m²`,
            type: "area" as const,
            coordinates: center.geometry.coordinates as [number, number],
            properties: {
              area: turf.area,
              createdAt: turf.createdAt,
              source: "turf",
            },
          };
        });

      newResults.areas = areaResults;

      setResults(newResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResultSelect = (result: SearchResult) => {
    if (result.coordinates) {
      const map = mapRef?.current?.getMap();
      if (map) {
        map.flyTo({
          center: result.coordinates,
          zoom: 14,
          duration: 1000,
        });
      }
    }

    // Handle different result types
    switch (result.type) {
      case "geocoder":
        if (result.coordinates) {
          insertPlacedMarker({
            id: `placed-marker-${Date.now()}`,
            label: result.title,
            notes: result.subtitle || "",
            point: {
              lng: result.coordinates[0],
              lat: result.coordinates[1],
            },
          });
        }
        break;
      case "marker":
        if (result.coordinates) {
          setSelectedMarker({
            id: parseInt(result.id.split("-")[1]),
            properties: result.properties || {},
            coordinates: result.coordinates,
          });
        }
        break;
      case "area":
        // Handle area selection - you can implement this based on your needs
        console.log("Selected area:", result);
        break;
    }

    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "geocoder":
        return <div className="h-3 w-3 rounded-full text-neutral-600" />;
      case "marker":
        return (
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: mapColors.markers.color }}
          />
        );
      case "area":
        return (
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: mapColors.areas.color }}
          />
        );
    }
  };

  const getResultBadge = (type: SearchResult["type"]) => {
    switch (type) {
      case "geocoder":
        return (
          <Badge variant="secondary" className="text-xs">
            Location
          </Badge>
        );
      case "marker":
        return (
          <Badge variant="outline" className="text-xs">
            Marker
          </Badge>
        );
      case "area":
        return (
          <Badge variant="default" className="text-xs">
            Area
          </Badge>
        );
    }
  };

  const allResults = [
    ...results.geocoder,
    ...results.markers,
    ...results.areas,
  ];

  const hasResults = allResults.length > 0;

  return (
    <div className="relative">
      {/* Search Trigger */}
      <Button
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-1 h-4 w-4" />
        <div className="ml-auto flex items-center gap-1 text-neutral-400">
          <Command className="h-3 w-3" />
          <span className="text-xs">K</span>
        </div>
      </Button>

      {/* Search Modal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/50"
            onClick={() => setIsOpen(false)}
          >
            <div className="fixed left-1/2 top-10 w-full max-w-2xl -translate-x-1/2">
              <Card className="shadow-2xl p-0">
                <CardContent className="p-0">
                  {/* Search Input */}
                  <div className="flex items-center border-b p-4">
                    <Search className="mr-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      placeholder="Search locations, markers, areas..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="border-0 p-0 shadow-none focus-visible:ring-0"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Results */}
                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : !hasResults && query ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No results found for &quot;{query}&quot;
                      </div>
                    ) : hasResults ? (
                      <div ref={resultsRef}>
                        {/* Marker Results */}
                        {results.markers.length > 0 && (
                          <div className="border-b">
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Markers
                            </div>
                            {results.markers.map((result, index) => (
                              <button
                                key={result.id}
                                className={`w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 ${
                                  selectedIndex ===
                                  results.geocoder.length + index
                                    ? "bg-muted"
                                    : ""
                                }`}
                                onClick={() => handleResultSelect(result)}
                              >
                                {getResultIcon(result.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {result.title}
                                  </div>
                                  {result.subtitle && (
                                    <div className="text-sm text-muted-foreground truncate">
                                      {result.subtitle}
                                    </div>
                                  )}
                                </div>
                                {getResultBadge(result.type)}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Area Results */}
                        {results.areas.length > 0 && (
                          <div>
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Areas
                            </div>
                            {results.areas.map((result, index) => (
                              <button
                                key={result.id}
                                className={`w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 ${
                                  selectedIndex ===
                                  results.geocoder.length +
                                    results.markers.length +
                                    index
                                    ? "bg-muted"
                                    : ""
                                }`}
                                onClick={() => handleResultSelect(result)}
                              >
                                {getResultIcon(result.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {result.title}
                                  </div>
                                  {result.subtitle && (
                                    <div className="text-sm text-muted-foreground truncate">
                                      {result.subtitle}
                                    </div>
                                  )}
                                </div>
                                {getResultBadge(result.type)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Start typing to search...
                      </div>
                    )}
                  </div>
                  {/* Geocoder Results */}
                  {results.geocoder.length > 0 && (
                    <div className="border-b">
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Locations
                      </div>
                      {results.geocoder.map((result, index) => (
                        <button
                          key={result.id}
                          className={`w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 ${
                            selectedIndex === index ? "bg-muted" : ""
                          }`}
                          onClick={() => handleResultSelect(result)}
                        >
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-muted-foreground truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          {getResultBadge(result.type)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t p-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>
                        Use ↑↓ to navigate, Enter to select, Esc to close
                      </span>
                      <span>{allResults.length} results</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
