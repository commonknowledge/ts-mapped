import { gql, useQuery } from "@apollo/client";
import { FilterIcon, ListFilter, XIcon } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState, useMemo } from "react";
import {
  FilterDataRecordsQuery,
  FilterDataRecordsQueryVariables,
  FilterOperator,
  FilterType,
  PlacedMarker,
  RecordFilterInput,
  Turf,
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
import { MARKER_ID_KEY } from "@/constants";
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
import { MarkerQueriesResult } from "../../types";

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
  const { placedMarkers, turfs, markerQueries } = useContext(MarkerAndTurfContext);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { selectedDataSourceId: tableDataSourceId } = useContext(TableContext);

  const tableDataSource = getDataSourceById(tableDataSourceId);
  const columns = tableDataSource?.columnDefs || [];
  const children = filter.children || [];

  // Debounced filter update for better UI response
  const setFilter = useCallback((f: RecordFilterInput) => {
    setTimeout(() => _setFilter(f), 1);
  }, [_setFilter]);

  // Debounced bounds fitting
  const triggerBoundsFitting = useCallback(() => {
    if (!mapRef?.current) return;

    const boundsOrPoint = getBoundsOfFilteredItems(filter, placedMarkers, turfs, markerQueries);

    if (Array.isArray(boundsOrPoint)) {
      mapRef.current.fitBounds(boundsOrPoint, { padding: 50, duration: 1000 });
    } else if (boundsOrPoint) {
      mapRef.current.flyTo(boundsOrPoint);
    }
  }, [filter, mapRef, markerQueries, placedMarkers, turfs]);

  const filterRef = useRef(filter);
  const childrenRef = useRef(children);

  // Update refs when values change
  useEffect(() => {
    filterRef.current = filter;
    childrenRef.current = children;
  }, [filter, children]);

  useEffect(() => {
    // Clean up filters when referenced items are removed
    const validChildren = children.filter(child => {
      if (child.type === FilterType.GEO) {
        // Check if placed marker still exists
        if (child.placedMarker && !placedMarkers.find(m => m.id === child.placedMarker)) {
          return false;
        }
        
        // Check if turf still exists
        if (child.turf && !turfs.find(t => t.id === child.turf)) {
          return false;
        }
        
        // Check if data source is still enabled in mapConfig (for member/marker collections)
        if (child.dataSourceId) {
          const isMemberSource = child.dataSourceId === mapConfig?.membersDataSourceId;
          const isMarkerSource = mapConfig?.markerDataSourceIds?.includes(child.dataSourceId);
          
          if (!isMemberSource && !isMarkerSource) return false;
        }
      }
      return true;
    });

    // Only update if we actually removed some filters
    if (validChildren.length !== children.length) {
      const updatedFilter = { ...filterRef.current, children: validChildren };
      _setFilter(updatedFilter);
    }
  }, [children, placedMarkers, turfs, mapConfig, _setFilter]);

  const setChildFilter = (index: number, childFilter: RecordFilterInput) => {
    const updatedFilter = {
      ...filter,
      children: children.map((f, i) => i === index ? childFilter : f),
    };
    setFilter(updatedFilter);
    triggerBoundsFitting();
  };

  const addFilter = (childFilter: RecordFilterInput) => {
    const newFilter = { ...filter, children: [...children, childFilter] };
    setFilter(newFilter);
    triggerBoundsFitting();
  };

  const removeFilter = (index: number) => {
    const updatedFilter = {
      ...filter,
      children: children.filter((_, i) => i !== index),
    };
    setFilter(updatedFilter);
    triggerBoundsFitting();
  };

  const updateOperator = (useAnd: boolean) => {
    const updatedFilter = {
      ...filter,
      operator: useAnd ? FilterOperator.AND : FilterOperator.OR,
    };
    setFilter(updatedFilter);
    triggerBoundsFitting();
  };

  // Build dropdown items
  const dropdownItems = useMemo(() => buildDropdownItems({
    mapConfig,
    getDataSourceById,
    placedMarkers,
    turfs,
    columns,
    addFilter,
  }), [mapConfig, getDataSourceById, placedMarkers, turfs, columns, addFilter]);

  return (
    <div className="flex gap-2">
      <div className="flex gap-2 items-center flex-wrap">
        {/* Filter chips */}
        <ul className="flex gap-2 items-center text-sm flex-wrap">
          {children.map((child, i) => (
            <li key={i} className="flex items-center border rounded-md pl-2 ">
              <ChildFilter
                filter={child}
                setFilter={(child) => setChildFilter(i, child)}
                triggerBoundsFitting={triggerBoundsFitting}
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => removeFilter(i)}
                className="px-2 border-l rounded-none text-muted-foreground h-7"
              >
                <XIcon className="w-2 h-2" />
              </Button>
            </li>
          ))}
          <div className="flex gap-2 items-center">
            {/* Add filter button */}
            <MultiDropdownMenu
              align="start"
              side="bottom"
              dropdownLabel="Filters"
              dropdownItems={dropdownItems}
              variant="outline"
              buttonSize="sm"
            >
              {children.length ? (
                <ListFilter className="w-4 h-4" />
              ) : (
                <div className="flex gap-2 items-center">
                  <ListFilter className="w-4 h-4" /> Filter
                </div>
              )}
            </MultiDropdownMenu>


            {/* Operator toggle */}
            {children.length > 0 ? (
              <OperatorToggle
                operator={filter.operator || FilterOperator.OR}
                onOperatorChange={updateOperator}
              />
            ) : null}
          </div>
        </ul>
      </div>
    </div>
  );
}

// Extracted operator toggle component
function OperatorToggle({
  operator,
  onOperatorChange
}: {
  operator: FilterOperator;
  onOperatorChange: (useAnd: boolean) => void;
}) {
  return (
    <Toggle
      pressed={operator !== FilterOperator.OR}
      onPressedChange={onOperatorChange}
    >
      <span className="text-sm text-muted-foreground font-normal">
        {operator === FilterOperator.OR ? (
          <span>
            Match <span className="font-medium text-primary">Any</span> |{" "}
            <span className="text-muted-foreground">All</span>
          </span>
        ) : (
          <span>
            Match <span className="text-muted-foreground">Any</span> |{" "}
            <span className="font-medium text-primary">All</span>
          </span>
        )}
      </span>
    </Toggle>
  );
}

// Extracted child filter component
function ChildFilter({
  filter,
  setFilter,
  triggerBoundsFitting,
}: TableFilterProps) {
  const { mapConfig } = useContext(MapContext);
  const color = getFilterColor(filter, mapConfig);
  const hasDistance = filter.placedMarker || filter.dataRecordId;

  const updateFilter = useCallback((updates: Partial<RecordFilterInput>) => {
    setFilter({ ...filter, ...updates });
    triggerBoundsFitting?.();
  }, [filter, setFilter, triggerBoundsFitting]);

  if (filter.type === FilterType.GEO) {
    return (
      <div className="flex gap-1 items-center">
        <span className="text-muted-foreground px-1">within</span>

        {hasDistance && (
          <DistanceInput
            value={filter.distance || 0}
            onChange={(distance) => updateFilter({ distance })}
          />
        )}

        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="whitespace-nowrap max-w-[100px] truncate pr-2 font-medium">
          {filter.label || "Unknown location"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-center">
      <span className="text-muted-foreground whitespace-nowrap">{filter.column} is</span>
      <Input
        type="text"
        placeholder="Search"
        value={filter.search || ""}
        onChange={(e) => updateFilter({ search: e.target.value })}
        className="w-20 h-7 p-2 text-sm text-center border-y-0 border-r-0 rounded-none bg-neutral-100 font-medium"
        required
      />
    </div>
  );
}

// Extracted distance input component
function DistanceInput({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <Input
        type="number"
        placeholder="Distance"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        required
        className="w-16 h-7 p-2 text-sm text-center border-y-0 rounded-none bg-neutral-100 font-medium always-show-spinner"
      />
      <span className="whitespace-nowrap text-muted-foreground px-1">km of</span>
    </>
  );
}

// Extracted data record command component
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
    { variables: { dataSourceId, search } },
  );

  // Client-side filtering: show only 5 records when no search, all when searching
  const displayedRecords = useMemo(() => {
    if (!data?.dataSource?.records) return [];

    if (!search) {
      // Show only first 5 records when no search
      return data.dataSource.records.slice(0, 5);
    }

    // Show all records when searching
    return data.dataSource.records;
  }, [data?.dataSource?.records, search]);

  const getItemLabel = useCallback((record: {
    externalId: string;
    json: Record<string, string>;
  }) => {
    const nameColumns = data?.dataSource?.columnRoles.nameColumns;
    if (!nameColumns?.length) return record.externalId;

    const label = nameColumns
      .map((column) => record.json[column])
      .map((name) => name.trim())
      .filter(Boolean)
      .join(" ");

    return label || record.externalId;
  }, [data?.dataSource?.columnRoles.nameColumns]);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={`Search ${label}`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Loading" : search ? "No results found." : "Type to search..."}
        </CommandEmpty>
        {displayedRecords.length > 0 ? (
          <CommandGroup heading={search ? "Search Results" : "Recent Records"}>
            {displayedRecords.map((record) => (
              <CommandItem key={record.id} value={record.id} className="p-0 w-full">
                <DropdownMenuItem onClick={() => onSelectRecord(record.id, getItemLabel(record))} className="w-full cursor-pointer">
                  {getItemLabel(record)}
                </DropdownMenuItem>
              </CommandItem>
            ))}
            {!search && data?.dataSource?.records && data.dataSource.records.length > 5 && (
              <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                Type to search all {data.dataSource.records.length} records
              </div>
            )}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}

// Helper functions
function getFilterColor(filter: RecordFilterInput, mapConfig: any): string {
  if (filter.placedMarker) return mapColors.markers.color;
  if (filter.turf) return mapColors.areas.color;
  if (filter.dataSourceId && filter.dataRecordId) {
    // Check if this is a marker collection (not a member data source)
    const isMarkerCollection = filter.dataSourceId !== mapConfig?.membersDataSourceId;
    return isMarkerCollection ? mapColors.markers.color : mapColors.member.color;
  }
  return mapColors.member.color;
}

function buildDropdownItems({
  mapConfig,
  getDataSourceById,
  placedMarkers,
  turfs,
  columns,
  addFilter,
}: {
  mapConfig: any;
  getDataSourceById: (id: string) => any;
  placedMarkers: PlacedMarker[];
  turfs: Turf[];
  columns: any[];
  addFilter: (filter: RecordFilterInput) => void;
}): DropdownMenuItemType[] {
  const memberCommand = mapConfig.membersDataSourceId ? (
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
  ) : null;

  const markerCommands = mapConfig.markerDataSourceIds.map((dataSourceId: string) => {
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
  });

  const placedMarkerItems: DropdownMenuItemType[] = placedMarkers.map((marker) => ({
    type: "item",
    label: marker.label,
    onClick: () => {
      addFilter({
        type: FilterType.GEO,
        placedMarker: marker.id,
        label: marker.label,
        distance: 1,
      });
    },
  }));

  const turfItems: DropdownMenuItemType[] = turfs.map((turf) => ({
    type: "item",
    label: turf.label,
    onClick: () => {
      addFilter({
        type: FilterType.GEO,
        turf: turf.id,
        label: turf.label,
      });
    },
  }));

  const columnItems: DropdownMenuItemType[] = columns.map((column) => ({
    type: "item",
    label: column.name,
    onClick: () => {
      addFilter({
        type: FilterType.TEXT,
        column: column.name,
      });
    },
  }));

  return [
    // Member Area
    ...(memberCommand ? [{
      type: "subcomponent",
      label: <div className="flex gap-1 items-center">
        <span className="text-muted-foreground whitespace-nowrap">Proximity to</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mapColors.member.color }} />
        <span className="font-medium text-primary">Member</span>
      </div>,
      component: memberCommand,
    } as DropdownSubComponent] : []),


    // Marker Area
    //If there is an placed markers or marker collection data, show the markers in a submenu
    ...(markerCommands.length || placedMarkerItems.length > 0 ? [{
      type: "submenu",
      label: <div className="flex gap-1 items-center">
        <span className="text-muted-foreground whitespace-nowrap">Proximity to</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mapColors.markers.color }} />
        <span className="font-medium text-primary">Marker</span>
      </div>,
      items: [
        //if theres is placed markers, show the markers in a submenu
        ...(placedMarkerItems.length > 0 ? [...placedMarkerItems] : []),

        //if theres is placed markers and marker collection data, show a separator
        ...(markerCommands.length > 0 && placedMarkerItems.length > 0 ? [{ type: "separator" }] : []),

        //if theres is marker collection data, show the markers in a submenu
        ...(markerCommands.length > 0 ?
          markerCommands.map(({ label, component }: { label: string; component: React.ReactNode }) => ({
            type: "subcomponent",
            label,
            component,
          }) as DropdownSubComponent)
          : []),
      ]
    } as DropdownSubMenu] : []),


    // Area Data
    ...(turfItems.length > 0 ? [{
      type: "submenu",
      label: <div className="flex gap-1 items-center">
        <span className="text-muted-foreground whitespace-nowrap">Within</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mapColors.areas.color }} />
        <span className="font-medium text-primary">Area</span>
      </div>,
      items: turfItems,
    } as DropdownSubMenu] : []),

    { type: "separator" },
    ...columnItems,
  ];
}

// Bounds calculation functions
function getBoundsOfFilteredItems(
  filter: RecordFilterInput,
  placedMarkers: PlacedMarker[],
  turfs: Turf[],
  markerQueries: MarkerQueriesResult | null,
) {
  const allCoordinates: [number, number][] = [];
  const currentFilters = filter.children || [];

  for (const filterItem of currentFilters) {
    if (filterItem.type === FilterType.GEO) {
      const coordinates = getCoordinatesFromFilter(filterItem, placedMarkers, turfs, markerQueries);
      if (coordinates.length > 0) {
        allCoordinates.push(...coordinates);
      }
    }
  }

  if (allCoordinates.length === 0) return null;
  if (allCoordinates.length === 1) {
    return { center: allCoordinates[0], zoom: 12, duration: 1000 };
  }

  return calculateBoundsFromCoordinates(allCoordinates);
}

function getCoordinatesFromFilter(
  filterItem: RecordFilterInput,
  placedMarkers: PlacedMarker[],
  turfs: Turf[],
  markerQueries: MarkerQueriesResult | null,
): [number, number][] {
  if (filterItem.placedMarker) {
    const marker = placedMarkers.find((m) => m.id === filterItem.placedMarker);
    if (marker) {
      const distance = filterItem.distance || 1;
      return calculateRadiusCoordinates(marker.point.lng, marker.point.lat, distance);
    }
  }

  if (filterItem.turf) {
    const turf = turfs.find((t) => t.id === filterItem.turf);
    if (turf?.polygon) {
      const bounds = getPolygonBounds(turf.polygon);
      if (bounds) {
        return [[bounds[0], bounds[1]], [bounds[2], bounds[3]]];
      }
    }
  }

  if (filterItem.dataRecordId && markerQueries?.data) {
    for (const queryResult of markerQueries.data) {
      const feature = queryResult.markers?.features?.find((f) =>
        f.properties[MARKER_ID_KEY] === filterItem.dataRecordId
      );

      if (feature) {
        const coords = getCoordinatesFromFeature(feature);
        if (coords) {
          const distance = filterItem.distance || 1;
          return calculateRadiusCoordinates(coords[0], coords[1], distance);
        }
      }
    }
  }

  return [];
}

function getCoordinatesFromFeature(feature: any): [number, number] | null {
  if (feature.geometry?.coordinates) {
    const [lng, lat] = feature.geometry.coordinates;
    return [lng, lat];
  }

  if (feature.properties?.__lng && feature.properties?.__lat) {
    return [Number(feature.properties.__lng), Number(feature.properties.__lat)];
  }

  return null;
}

function calculateBoundsFromCoordinates(coordinates: [number, number][]): [number, number, number, number] {
  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);

  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];
}

function getPolygonBounds(polygon: { coordinates?: number[][][] }): [number, number, number, number] | null {
  try {
    const coords = polygon?.coordinates?.[0];
    if (!Array.isArray(coords)) return null;

    const lngs = coords.map(([lng]) => lng);
    const lats = coords.map(([, lat]) => lat);

    return [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ];
  } catch (error) {
    console.warn("Error calculating polygon bounds:", error);
    return null;
  }
}

function calculateRadiusCoordinates(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
): [number, number][] {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

  return [
    [centerLng - lngDelta, centerLat - latDelta], // Southwest
    [centerLng + lngDelta, centerLat - latDelta], // Southeast
    [centerLng + lngDelta, centerLat + latDelta], // Northeast
    [centerLng - lngDelta, centerLat + latDelta], // Northwest
  ];
}
