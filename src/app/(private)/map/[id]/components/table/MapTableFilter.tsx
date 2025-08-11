import { gql, useQuery } from "@apollo/client";
import { FilterIcon, XIcon } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  FilterDataRecordsQuery,
  FilterDataRecordsQueryVariables,
  FilterOperator,
  FilterType,
  RecordFilterInput,
} from "@/__generated__/types";
import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import { MarkerAndTurfContext } from "@/app/(private)/map/[id]/context/MarkerAndTurfContext";
import { TableContext } from "@/app/(private)/map/[id]/context/TableContext";
import MultiDropdownMenu, {
  DropdownItem,
  DropdownMenuItemType,
  DropdownSeparator,
  DropdownSubComponent,
  DropdownSubMenu,
} from "@/components/MultiDropdownMenu";
import { Button } from "@/shadcn/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { DropdownMenuItem } from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import { Toggle } from "@/shadcn/ui/toggle";
import { mapColors } from "../../styles";

interface TableFilterProps {
  filter: RecordFilterInput;
  setFilter: (f: RecordFilterInput) => void;
  triggerBoundsFitting?: () => void;
}

export default function MapTableFilter({
  filter,
  setFilter,
}: TableFilterProps) {
  return (
    <div>
      <MultiFilter filter={filter} setFilter={setFilter} />
    </div>
  );
}

function MultiFilter({ filter, setFilter: _setFilter }: TableFilterProps) {
  const { mapConfig, mapRef } = useContext(MapContext);
  const { placedMarkers, turfs, markerQueries } =
    useContext(MarkerAndTurfContext);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { selectedDataSourceId: tableDataSourceId } = useContext(TableContext);

  const tableDataSource = getDataSourceById(tableDataSourceId);
  const columns = tableDataSource?.columnDefs || [];

  const children = filter.children || [];

  // Use a ref to track the latest filter state for bounds fitting
  const latestFilterRef = useRef(filter);
  latestFilterRef.current = filter;

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Function to trigger bounds fitting with debouncing
  const triggerBoundsFitting = useCallback(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fitBoundsToFilteredItems();
    }, 100);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [triggerBoundsFitting]);

  const setChildFilter = (index: number, childFilter: RecordFilterInput) => {
    const updatedFilter = {
      ...filter,
      children: children.map((f, i) => {
        if (i === index) {
          return childFilter;
        }
        return f;
      }),
    };
    _setFilter(updatedFilter);
    triggerBoundsFitting();
  };

  const addFilter = (childFilter: RecordFilterInput) => {
    const newFilter = { ...filter, children: children.concat([childFilter]) };
    _setFilter(newFilter);
    triggerBoundsFitting();
  };

  // Function to fit map bounds to show all filtered items
  const fitBoundsToFilteredItems = () => {
    if (!mapRef?.current) return;

    const allCoordinates: [number, number][] = [];

    // Get coordinates from all current filters
    const currentFilters = filter.children || [];

    for (const filterItem of currentFilters) {
      if (filterItem.type === FilterType.GEO) {
        if (filterItem.placedMarker) {
          // Add placed marker coordinates
          const marker = placedMarkers.find(
            (m) => m.id === filterItem.placedMarker
          );
          if (marker) {
            allCoordinates.push([marker.point.lng, marker.point.lat]);
          }
        } else if (filterItem.turf) {
          // Add turf polygon bounds
          const turf = turfs.find((t) => t.id === filterItem.turf);
          if (turf) {
            try {
              const bounds = getPolygonBounds(turf.polygon);
              if (bounds) {
                allCoordinates.push([bounds[0], bounds[1]]); // minLng, minLat
                allCoordinates.push([bounds[2], bounds[3]]); // maxLng, maxLat
              }
            } catch (error) {
              console.warn("Could not calculate turf bounds:", error);
            }
          }
        } else if (filterItem.dataRecordId) {
          // Add data record coordinates from marker queries
          console.log(
            "Looking for member/marker with ID:",
            filterItem.dataRecordId
          );
          console.log("Available marker queries:", markerQueries);

          if (markerQueries?.data && Array.isArray(markerQueries.data)) {
            console.log("Processing marker queries data:", markerQueries.data);
            for (const queryResult of markerQueries.data) {
              console.log("Checking query result:", queryResult);
              if (queryResult.markers?.features) {
                console.log(
                  "Features in this query:",
                  queryResult.markers.features
                );
                const feature = queryResult.markers.features.find(
                  (f: { properties?: { __recordId?: string } }) => {
                    console.log("Checking feature properties:", f.properties);
                    return f.properties?.__recordId === filterItem.dataRecordId;
                  }
                );
                if (feature) {
                  console.log("Found matching feature:", feature);
                  // Check if coordinates exist in the feature
                  if (feature.geometry?.coordinates) {
                    const [lng, lat] = feature.geometry.coordinates;
                    console.log("Found coordinates for member:", { lng, lat });
                    allCoordinates.push([lng, lat]);
                    break; // Found the record, no need to check other queries
                  } else {
                    console.log(
                      "Feature found but no coordinates in geometry:",
                      feature.geometry
                    );
                    // Try to find coordinates in properties or other locations
                    if (
                      feature.properties?.__lng &&
                      feature.properties?.__lat
                    ) {
                      const lng = Number(feature.properties.__lng);
                      const lat = Number(feature.properties.__lat);
                      console.log("Found coordinates in properties:", {
                        lng,
                        lat,
                      });
                      allCoordinates.push([lng, lat]);
                      break;
                    }
                  }
                }
              } else {
                console.log("No features in this query result");
              }
            }
          } else {
            console.log("No marker queries data available");
          }
        }
      }
    }

    // If we have coordinates, fit the bounds
    if (allCoordinates.length > 0) {
      console.log("Fitting bounds to coordinates:", allCoordinates);

      if (allCoordinates.length === 1) {
        // Single point - fly to it
        mapRef.current.flyTo({
          center: allCoordinates[0],
          zoom: 12,
          duration: 1000,
        });
      } else {
        // Multiple points - calculate bounds and fit
        const bounds = calculateBoundsFromCoordinates(allCoordinates);
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
        });
      }
    }
  };

  // Helper function to calculate bounds from a list of coordinates
  const calculateBoundsFromCoordinates = (
    coordinates: [number, number][]
  ): [number, number, number, number] => {
    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;

    for (const [lng, lat] of coordinates) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    return [minLng, minLat, maxLng, maxLat];
  };

  // Helper function to calculate bounds for a polygon
  const getPolygonBounds = (polygon: {
    coordinates?: number[][][];
  }): [number, number, number, number] | null => {
    try {
      if (polygon?.coordinates && Array.isArray(polygon.coordinates[0])) {
        const coords = polygon.coordinates[0]; // First ring of polygon
        let minLng = Infinity,
          maxLng = -Infinity,
          minLat = Infinity,
          maxLat = -Infinity;

        for (const coord of coords) {
          const [lng, lat] = coord;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }

        return [minLng, minLat, maxLng, maxLat];
      }
    } catch (error) {
      console.warn("Error calculating polygon bounds:", error);
    }
    return null;
  };

  const placedMarkerItems: DropdownMenuItemType[] = placedMarkers.map((m) => {
    return {
      type: "item",
      label: m.label,
      onClick: () => {
        addFilter({
          type: FilterType.GEO,
          placedMarker: m.id,
          label: m.label,
          distance: 1,
        });
      },
    };
  });
  const turfItems: DropdownMenuItemType[] = turfs.map((t) => {
    return {
      type: "item" as const,
      label: t.label,
      onClick: () => {
        addFilter({
          type: FilterType.GEO,
          turf: t.id,
          label: t.label,
        });
      },
    };
  });

  const memberCommand = (
    <DataRecordCommand
      label="Members"
      dataSourceId={mapConfig.membersDataSourceId}
      onSelectRecord={(id, label) => {
        addFilter({
          type: FilterType.GEO,
          dataRecordId: id,
          dataSourceId: mapConfig.membersDataSourceId,
          label,
          distance: 1,
        });
      }}
    />
  );
  const labelledMarkerCommands = mapConfig.markerDataSourceIds.map(
    (dataSourceId) => {
      const markerDataSource = getDataSourceById(dataSourceId);
      return {
        label: markerDataSource?.name || "Unknown data source",
        component: (
          <DataRecordCommand
            key={dataSourceId}
            label={markerDataSource?.name || "unknown data source"}
            dataSourceId={dataSourceId}
            onSelectRecord={(id, label) => {
              addFilter({
                type: FilterType.GEO,
                dataRecordId: id,
                dataSourceId: dataSourceId,
                label,
                distance: 1,
              });
            }}
          />
        ),
      };
    }
  );

  const dropdownItems = [
    ...(memberCommand
      ? [
          {
            type: "subcomponent",
            label: "Promixty to Member",
            component: memberCommand,
          } as DropdownSubComponent,
        ]
      : []),
    ...(labelledMarkerCommands.length > 0
      ? [
          {
            type: "submenu",
            label: "Promixty to Marker",
            items: [
              ...labelledMarkerCommands.map(
                ({ label, component }) =>
                  ({
                    type: "subcomponent",
                    label,
                    component,
                  }) as DropdownSubComponent
              ),
              ...(labelledMarkerCommands.length > 0
                ? [{ type: "separator" as const }]
                : []),
              ...placedMarkerItems,
            ],
          } as DropdownSubMenu,
        ]
      : []),
    ...(turfItems.length > 0
      ? [
          {
            type: "submenu",
            label: "Within Area",
            items: turfItems,
          } as DropdownSubMenu,
        ]
      : []),
    { type: "separator" } as DropdownSeparator,
    ...(columns.map((c) => {
      return {
        type: "item" as const,
        label: c.name,
        onClick: () => {
          addFilter({
            type: FilterType.TEXT,
            column: c.name,
          });
        },
      };
    }) as DropdownItem[]),
  ];

  return (
    <>
      {/* Overlay that dims everything when filters are active */}
      {filter.children && filter.children.length > 0 && (
        <div className="fixed inset-0 bg-black/20 z-40 pointer-events-none" />
      )}
      
      <div className="flex  gap-2 relative z-50">
        <div className="flex gap-2 items-center flex-wrap">
        <ul className="flex gap-2 items-center text-sm ">
          {children.map((child, i) => (
            <li
              key={i}
              className="flex gap-1 items-center border rounded-md pl-2 flex-1"
            >
              <ChildFilter
                filter={child}
                setFilter={(child) => setChildFilter(i, child)}
                triggerBoundsFitting={triggerBoundsFitting}
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  const updatedFilter = {
                    ...filter,
                    children: filter.children?.filter((_, j) => i !== j),
                  };
                  _setFilter(updatedFilter);
                  // Trigger bounds fitting when removing a filter
                  setTimeout(() => triggerBoundsFitting(), 50);
                }}
                className="px-2! border-l rounded-none text-muted-foreground h-7"
              >
                <XIcon className="w-2 h-2" />
              </Button>
            </li>
          ))}
        </ul>
        <MultiDropdownMenu
          align="start"
          side="bottom"
          dropdownLabel="Filters"
          dropdownItems={dropdownItems}
        >
          Filter <FilterIcon className="w-4 h-4" />
        </MultiDropdownMenu>
      </div>
      <div>
        <Toggle
          pressed={filter.operator !== FilterOperator.OR}
          onPressedChange={(value) => {
            const updatedFilter = {
              ...filter,
              operator: value ? FilterOperator.AND : FilterOperator.OR,
            };
            _setFilter(updatedFilter);
            // Trigger bounds fitting when changing operator
            setTimeout(() => triggerBoundsFitting(), 50);
          }}
        >
          <span>
            {filter.operator === FilterOperator.OR ? "Match any" : "Match all"}
          </span>
        </Toggle>
      </div>
    </>
  );
}

function ChildFilter({
  filter,
  setFilter,
  triggerBoundsFitting,
}: TableFilterProps) {
  const color = filter.placedMarker
    ? mapColors.markers.color
    : filter.turf
      ? mapColors.areas.color
      : mapColors.member.color;

  const hasDistance = filter.placedMarker || filter.dataRecordId;
  return (
    <div className="flex gap-1 items-center">
      {filter.type === FilterType.GEO ? (
        <>
          <span className="text-muted-foreground px-1">within</span>
          {hasDistance && (
            <>
              <Input
                type="number"
                placeholder="Distance"
                value={filter.distance || 0}
                onChange={(e) => {
                  const updatedFilter = {
                    ...filter,
                    distance: parseInt(e.target.value, 10) || 0,
                  };
                  setFilter(updatedFilter);
                  // Trigger bounds fitting when changing distance
                  if (triggerBoundsFitting) {
                    setTimeout(() => triggerBoundsFitting(), 50);
                  }
                }}
                required
                className="w-16 h-7 p-2 text-sm text-center border-y-0 rounded-none bg-neutral-100 font-medium"
              />
              <span className="whitespace-nowrap text-muted-foreground px-1">
                km of
              </span>
            </>
          )}
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
            }}
          />

          <span className="whitespace-nowrap max-w-[100px] truncate">
            {filter.label || "Unknown location"}
          </span>
        </>
      ) : (
        <>
          <span>{filter.column}</span>
          <span>is</span>
          <Input
            type="text"
            placeholder="Search"
            value={filter.search || ""}
            onChange={(e) => {
              const updatedFilter = { ...filter, search: e.target.value };
              setFilter(updatedFilter);
              // Trigger bounds fitting when changing search
              if (triggerBoundsFitting) {
                setTimeout(() => triggerBoundsFitting(), 50);
              }
            }}
            className="w-20 h-7 p-2 text-sm text-center border-y-0 rounded-none bg-neutral-100 font-medium"
            required
          />
        </>
      )}
    </div>
  );
}

function DataRecordCommand({
  label,
  dataSourceId,
  onSelectRecord,
}: {
  label: string;
  dataSourceId: string;
  onSelectRecord: (id: string, label: string) => void;
}) {
  const [search, setSearch] = useState("");

  const { data, loading } = useQuery<
    FilterDataRecordsQuery,
    FilterDataRecordsQueryVariables
  >(
    gql`
      query FilterDataRecords($dataSourceId: String!, $search: String) {
        dataSource(id: $dataSourceId) {
          columnRoles {
            nameColumns
          }
          records(search: $search) {
            id
            externalId
            json
          }
        }
      }
    `,
    { variables: { dataSourceId, search } }
  );

  const getItemLabel = (record: {
    externalId: string;
    json: Record<string, string>;
  }) => {
    const nameColumns = data?.dataSource?.columnRoles.nameColumns;
    let label = "";
    if (nameColumns && nameColumns.length) {
      label = nameColumns
        .map((column) => record.json[column])
        .map((name) => name.trim())
        .filter(Boolean)
        .join(" ");
    }
    return label || record.externalId;
  };

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={`Search ${label}`}
        value={search}
        onValueChange={(v) => setSearch(v)}
      />
      <CommandList>
        <CommandEmpty>{loading ? "Loading" : "No results found."}</CommandEmpty>
        {data?.dataSource?.records?.length ? (
          <CommandGroup heading="Suggestions">
            {data?.dataSource?.records?.map((r) => {
              const label = getItemLabel(r);
              return (
                <CommandItem key={r.id} value={r.id} className="p-0">
                  <DropdownMenuItem
                    key={r.id}
                    onClick={() => onSelectRecord(r.id, label)}
                  >
                    {label}
                  </DropdownMenuItem>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}
