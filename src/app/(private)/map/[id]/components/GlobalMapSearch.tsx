"use client";

import * as turfLib from "@turf/turf";
import { Command, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { createPortal } from "react-dom";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
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
  type: "geocoder" | "marker" | "area" | "member";
  coordinates?: [number, number];
  properties?: Record<string, unknown>;
}

interface GroupedResults {
  geocoder: SearchResult[];
  markers: SearchResult[];
  areas: SearchResult[];
  members: SearchResult[];
}

// Mapbox API response types
interface MapboxSearchBoxSuggestion {
  name?: string;
  name_preferred?: string;
  full_address?: string;
  feature_type?: string;
  maki?: string;
  metadata?: Record<string, unknown>;
  mapbox_id?: string;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
  // Alternative coordinate formats
  center?: [number, number];
  geometry?: {
    coordinates: [number, number];
  };
}

interface MapboxRetrieveFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    feature_type?: string;
    maki?: string;
    metadata?: Record<string, unknown>;
  };
}

interface MapboxSearchBoxResponse {
  suggestions?: MapboxSearchBoxSuggestion[];
}

interface MapboxGeocodingFeature {
  place_name: string;
  center: [number, number];
  place_type: string[];
  relevance: number;
}

interface MapboxGeocodingResponse {
  features?: MapboxGeocodingFeature[];
}

export default function GlobalMapSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedResults>({
    geocoder: [],
    markers: [],
    areas: [],
    members: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sessionToken] = useState(() => crypto.randomUUID());

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { mapRef, viewConfig } = useContext(MapContext);

  const {
    insertPlacedMarker,
    setSelectedMarker,
    placedMarkers,
    turfs,
    markerQueries,
  } = useContext(MarkerAndTurfContext);

  const { setSelectedRecordId, handleDataSourceSelect, selectedDataSourceId } =
    useContext(TableContext);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const query = searchQuery.toLowerCase();
      const newResults: GroupedResults = {
        geocoder: [],
        markers: [],
        areas: [],
        members: [],
      };

      try {
        // Real Mapbox Search Box API (same as SearchBox component)
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        if (mapboxToken && searchQuery.trim()) {
          const searchBoxUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
            searchQuery,
          )}&access_token=${mapboxToken}&session_token=${sessionToken}&country=gb&types=place,address,poi&limit=5`;

          const response = await fetch(searchBoxUrl);

          if (response.ok) {
            const data: MapboxSearchBoxResponse = await response.json();

            if (data.suggestions && Array.isArray(data.suggestions)) {
              // Search Box API only provides suggestions, we need to retrieve the full features
              const geocoderResults: SearchResult[] = [];

              // Get the mapbox_ids from suggestions
              const mapboxIds = data.suggestions
                .map((suggestion) => suggestion.mapbox_id)
                .filter(Boolean);

              if (mapboxIds.length > 0) {
                console.log(
                  "🔍 Retrieving full features for mapbox_ids:",
                  mapboxIds,
                );

                // Retrieve each feature individually
                for (let i = 0; i < Math.min(mapboxIds.length, 5); i++) {
                  const mapboxId = mapboxIds[i];
                  const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${mapboxToken}&session_token=${sessionToken}`;
                  console.log(
                    `🌐 Retrieve API URL for ${mapboxId}:`,
                    retrieveUrl,
                  );

                  try {
                    const retrieveResponse = await fetch(retrieveUrl);

                    if (retrieveResponse.ok) {
                      const retrieveData = await retrieveResponse.json();

                      if (
                        retrieveData.features &&
                        Array.isArray(retrieveData.features) &&
                        retrieveData.features.length > 0
                      ) {
                        const feature: MapboxRetrieveFeature =
                          retrieveData.features[0];
                        if (
                          feature.geometry &&
                          feature.geometry.coordinates &&
                          Array.isArray(feature.geometry.coordinates) &&
                          feature.geometry.coordinates.length === 2
                        ) {
                          geocoderResults.push({
                            id: `geo-${i}`,
                            title:
                              feature.properties?.name_preferred ||
                              feature.properties?.name ||
                              feature.properties?.full_address ||
                              "Unknown location",
                            subtitle: feature.properties?.full_address || "",
                            type: "geocoder" as const,
                            coordinates: feature.geometry.coordinates as [
                              number,
                              number,
                            ],
                            properties: {
                              featureType: feature.properties?.feature_type,
                              maki: feature.properties?.maki,
                              metadata: feature.properties?.metadata,
                            },
                          });
                        }
                      }
                    }
                  } catch (error) {
                    console.error(`Search error for ${mapboxId}:`, error);
                  }
                }
              }

              newResults.geocoder = geocoderResults;
            } else {
              // Fallback to regular Geocoding API
              const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                searchQuery,
              )}.json?access_token=${mapboxToken}&country=gb&types=place,address,poi&limit=5`;

              const geocodingResponse = await fetch(geocodingUrl);

              if (geocodingResponse.ok) {
                const geocodingData: MapboxGeocodingResponse =
                  await geocodingResponse.json();

                if (
                  geocodingData.features &&
                  Array.isArray(geocodingData.features)
                ) {
                  const geocoderResults: SearchResult[] =
                    geocodingData.features.map(
                      (feature: MapboxGeocodingFeature, index: number) => ({
                        id: `geo-${index}`,
                        title: feature.place_name.split(",")[0],
                        subtitle: feature.place_name,
                        type: "geocoder" as const,
                        coordinates: feature.center as [number, number],
                        properties: {
                          placeType: feature.place_type[0],
                          relevance: feature.relevance,
                        },
                      }),
                    );
                  newResults.geocoder = geocoderResults;
                }
              }
            }
          }
        }

        // Real marker results from placedMarkers
        const markerResults: SearchResult[] = placedMarkers
          .filter(
            (marker) =>
              marker.label.toLowerCase().includes(query) ||
              marker.notes?.toLowerCase().includes(query),
          )
          .map((marker) => ({
            id: marker.id,
            title: marker.label,
            subtitle: marker.notes || "Placed marker",
            type: "marker" as const,
            coordinates: [marker.point.lng, marker.point.lat] as [
              number,
              number,
            ],
            properties: { source: "placed" },
          }));

        // Add data source markers if available (excluding members)
        if (markerQueries?.data) {
          markerQueries.data.forEach((dataSource) => {
            // Skip the members data source - those are handled separately
            if (dataSource.dataSourceId === viewConfig.membersDataSourceId) {
              return;
            }

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
              turf.notes?.toLowerCase().includes(query),
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

        // Real member results from markerQueries (members data source)
        const memberResults: SearchResult[] = [];
        if (markerQueries?.data) {
          const memberDataSource = markerQueries.data.find(
            (ds) => ds.dataSourceId === viewConfig.membersDataSourceId,
          );

          if (memberDataSource && memberDataSource.markers.features) {
            memberDataSource.markers.features
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
              .forEach((feature, index) => {
                memberResults.push({
                  id: `member-${index}`,
                  title:
                    feature.properties?.Name ||
                    feature.properties?.name ||
                    feature.properties?.label ||
                    feature.properties?.full_name ||
                    feature.properties?.first_name ||
                    feature.properties?.last_name ||
                    feature.properties?.email ||
                    feature.properties?.id ||
                    "Unnamed member",
                  subtitle: `${memberDataSource.dataSourceName} • ${feature.properties?.Postcode || feature.properties?.address || ""}`,
                  type: "member" as const,
                  coordinates: feature.geometry.coordinates as [number, number],
                  properties: {
                    source: "member",
                    dataSourceId: memberDataSource.dataSourceId,
                    dataSourceName: memberDataSource.dataSourceName,
                    ...feature.properties,
                  },
                });
              });
          }
        }

        newResults.members = memberResults;

        setResults(newResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      placedMarkers,
      markerQueries?.data,
      turfs,
      sessionToken,
      viewConfig.membersDataSourceId,
    ],
  );

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
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
        case "member":
          // First, open the members data source in the table panel if not already open
          if (result.properties?.dataSourceId) {
            const dataSourceId = result.properties.dataSourceId as string;
            if (selectedDataSourceId !== dataSourceId) {
              handleDataSourceSelect(dataSourceId);
            }
          }
          // Set the selected record ID for the member
          if (result.properties?.id) {
            setSelectedRecordId(result.properties.id as string);
          }
          // Reset map to center, then fly to member location
          if (result.coordinates) {
            const map = mapRef?.current?.getMap();
            if (map) {
              // First reset to center of the map
              map.flyTo({
                center: [-4.5481, 54.2361], // Default center (UK)
                zoom: 5,
                duration: 500,
              });
              // Then fly to the member location after a short delay
              setTimeout(() => {
                map.flyTo({
                  center: result.coordinates,
                  zoom: 15,
                  duration: 1000,
                });
              }, 600);
            }
          }
          break;
      }

      setIsOpen(false);
      setQuery("");
      setSelectedIndex(0);
    },
    [
      handleDataSourceSelect,
      insertPlacedMarker,
      mapRef,
      selectedDataSourceId,
      setSelectedMarker,
      setSelectedRecordId,
    ],
  );

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
      case "member":
        return (
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: mapColors.member.color }}
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
      case "member":
        return (
          <Badge variant="secondary" className="text-xs">
            Member
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
        ...results.members,
      ];

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : 0,
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allResults.length - 1,
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
  }, [handleResultSelect, isOpen, results, selectedIndex]);

  // Auto-scroll to keep selected item in view
  useEffect(() => {
    if (!isOpen || !resultsRef.current) return;

    const allResults = [
      ...results.geocoder,
      ...results.markers,
      ...results.areas,
      ...results.members,
    ];

    if (selectedIndex >= 0 && selectedIndex < allResults.length) {
      const selectedButton = resultsRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`,
      ) as HTMLElement;

      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, isOpen, results]);

  // Search functionality
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ geocoder: [], markers: [], areas: [], members: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  useEffect(() => {
    if (!isOpen) return;

    let idx = 0;
    if (results.areas.length > 0) {
      idx = results.geocoder.length + results.markers.length;
    } else if (results.members.length > 0) {
      idx =
        results.geocoder.length + results.markers.length + results.areas.length;
    } else if (results.markers.length > 0) {
      idx = results.geocoder.length;
    } else {
      idx = 0;
    }
    setSelectedIndex(idx);
  }, [results, isOpen]);

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
                <CardContent
                  className="p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search Input */}
                  <div
                    className="flex items-center border-b p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Search className="mr-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      placeholder="Search locations, markers, areas..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
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

                  {/* Results for markers and areas */}
                  <div
                    className="max-h-96 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                        {/* Area Results */}
                        {results.areas.length > 0 && (
                          <div className="border-b">
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Areas
                            </div>
                            {results.areas.map((result, index) => (
                              <button
                                key={result.id}
                                data-result-index={
                                  results.geocoder.length +
                                  results.markers.length +
                                  index
                                }
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

                        {/* Member Results */}
                        {results.members.length > 0 && (
                          <div className="border-b">
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Members
                            </div>
                            {results.members.map((result, index) => (
                              <button
                                key={result.id}
                                data-result-index={
                                  results.geocoder.length +
                                  results.markers.length +
                                  results.areas.length +
                                  index
                                }
                                className={`w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 ${
                                  selectedIndex ===
                                  results.geocoder.length +
                                    results.markers.length +
                                    results.areas.length +
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

                        {/* Marker Results */}
                        {results.markers.length > 0 && (
                          <div className="border-b">
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Markers
                            </div>
                            {results.markers.map((result, index) => (
                              <button
                                key={result.id}
                                data-result-index={
                                  results.geocoder.length + index
                                }
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

                        {/* Search API Results */}
                        {results.geocoder.length > 0 && (
                          <div>
                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Locations
                            </div>
                            {results.geocoder.map((result, index) => (
                              <button
                                key={result.id}
                                data-result-index={index}
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
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Start typing to search...
                      </div>
                    )}
                  </div>

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
          document.body,
        )}
    </div>
  );
}
