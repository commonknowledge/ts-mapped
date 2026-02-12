"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapIcon, MapPinIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useTRPC } from "@/services/trpc/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { usePlacedMarkerState } from "../hooks/usePlacedMarkers";
import styles from "./SearchBox.module.css";
import type { Point } from "geojson";

const mapboxFeatureSchema = z.object({
  id: z.string(),
  type: z.string(),
  place_type: z.array(z.string()),
  relevance: z.number(),
  properties: z.object({
    mapbox_id: z.string().optional(),
  }),
  text: z.string(),
  place_name: z.string(),
  center: z.tuple([z.number(), z.number()]),
  geometry: z.object({
    type: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  context: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
      }),
    )
    .optional(),
});

const mapboxResponseSchema = z.object({
  type: z.string(),
  query: z.array(z.string()),
  features: z.array(mapboxFeatureSchema),
});

type MapboxFeature = z.infer<typeof mapboxFeatureSchema>;

// Helper function to calculate center of a polygon/multipolygon
function calculateCenter(geography: {
  type: string;
  coordinates: number[][][] | number[][][][];
}): [number, number] {
  if (geography.type === "Polygon") {
    const coords = geography.coordinates as number[][][];
    const ring = coords[0] as [number, number][];
    const center = ring.reduce(
      (acc, coord) =>
        [acc[0] + coord[0], acc[1] + coord[1]] as [number, number],
      [0, 0] as [number, number],
    );
    return [center[0] / ring.length, center[1] / ring.length];
  } else if (geography.type === "MultiPolygon") {
    const coords = geography.coordinates as number[][][][];
    const firstPolygon = coords[0][0] as [number, number][];
    const center = firstPolygon.reduce(
      (acc, coord) =>
        [acc[0] + coord[0], acc[1] + coord[1]] as [number, number],
      [0, 0] as [number, number],
    );
    return [center[0] / firstPolygon.length, center[1] / firstPolygon.length];
  }
  return [0, 0];
}

export function SearchBox() {
  const { setSearchMarker } = usePlacedMarkerState();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mapboxResults, setMapboxResults] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Debounce search input
  useEffect(() => {
    if (!search || search.length < 2) {
      setDebouncedSearch("");
      return;
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Search areas using tRPC
  const { data: areaResults = [] } = useQuery(
    trpc.area.search.queryOptions(
      { query: debouncedSearch },
      { enabled: debouncedSearch.length >= 2 },
    ),
  );

  // Detect platform
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
  }, []);

  // Toggle command dialog with keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch results from Mapbox Geocoding API
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setMapboxResults([]);
      return;
    }

    const fetchMapboxResults = async () => {
      setLoading(true);
      try {
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(debouncedSearch)}.json?access_token=${accessToken}&country=GB&limit=10`,
        );
        const json = await response.json();
        const data = mapboxResponseSchema.parse(json);
        setMapboxResults(data.features || []);
      } catch (error) {
        console.error("Failed to fetch geocoding results:", error);
        setMapboxResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMapboxResults();
  }, [debouncedSearch]);

  const handleSelectMapbox = (feature: MapboxFeature) => {
    // Convert Mapbox feature to the format expected by setSearchMarker
    setSearchMarker({
      id: feature.id,
      type: "Feature",
      geometry: feature.geometry as Point,
      properties: {
        name: feature.text,
        full_address: feature.place_name,
        place_formatted: feature.place_name,
        coordinates: {
          longitude: feature.center[0],
          latitude: feature.center[1],
        },
      },
    });
    setOpen(false);
    setSearch("");
  };

  const handleSelectArea = async (area: (typeof areaResults)[number]) => {
    // Fetch the full area data with geometry using the byCode endpoint
    const areaWithGeometry = await queryClient.fetchQuery(
      trpc.area.byCode.queryOptions({
        code: area.code,
        areaSetCode: area.areaSetCode as never,
      }),
    );

    if (!areaWithGeometry) return;

    // Calculate center point from geometry
    const center = calculateCenter(areaWithGeometry.geography);

    setSearchMarker({
      id: `area-${area.id}`,
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: center,
      } as Point,
      properties: {
        name: area.name,
        full_address: `${area.name} (${area.areaSetName})`,
        place_formatted: `${area.name} - ${area.code}`,
        coordinates: {
          longitude: center[0],
          latitude: center[1],
        },
      },
    });
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <div className={styles["search-box"]}>
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <MapPinIcon className="h-4 w-4" />
          <span>Search location...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            {isMac ? <span className="text-xs">⌘</span> : "Ctrl+"}K
          </kbd>
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search for a location..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : "No results found."}
          </CommandEmpty>
          {areaResults.length > 0 && (
            <CommandGroup heading="Areas">
              {areaResults.map((area) => (
                <CommandItem
                  key={`area-${area.id}`}
                  value={`${area.name} ${area.code} ${area.areaSetName}`}
                  onSelect={() => handleSelectArea(area)}
                >
                  <MapIcon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{area.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {area.areaSetName} • {area.code}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {mapboxResults.length > 0 && (
            <CommandGroup heading="Locations">
              {mapboxResults.map((feature) => (
                <CommandItem
                  key={feature.id}
                  value={feature.place_name}
                  onSelect={() => handleSelectMapbox(feature)}
                >
                  <MapPinIcon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{feature.text}</span>
                    <span className="text-xs text-muted-foreground">
                      {feature.place_name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
