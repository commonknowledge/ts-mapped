import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ListFilter, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { usePlacedMarkersQuery } from "@/app/map/[id]/hooks/usePlacedMarkers";
import { useTurfsQuery } from "@/app/map/[id]/hooks/useTurfs";
import { usePrivateMapStore } from "@/app/map/[id]/stores/usePrivateMapStore";
import MultiDropdownMenu from "@/components/MultiDropdownMenu";
import { FilterOperator, FilterType } from "@/server/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { Input } from "@/shadcn/ui/input";
import { Toggle } from "@/shadcn/ui/toggle";
import { mapColors } from "../../styles";
import type {
  DropdownMenuItemType,
  DropdownSubComponent,
  DropdownSubMenu,
} from "@/components/MultiDropdownMenu";
import type { DataRecord } from "@/server/models/DataRecord";
import type { ColumnDef } from "@/server/models/DataSource";
import type { MapConfig } from "@/server/models/Map";
import type { RecordFilterInput } from "@/server/models/MapView";
import type { PlacedMarker } from "@/server/models/PlacedMarker";
import type { Turf } from "@/server/models/Turf";

interface TableFilterProps {
  filter: RecordFilterInput;
  setFilter: (f: RecordFilterInput) => void;
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
  const { mapConfig } = useMapConfig();
  const { data: turfs = [] } = useTurfsQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { getDataSourceById } = useDataSources();
  const tableDataSourceId = usePrivateMapStore((s) => s.selectedDataSourceId);

  const tableDataSource = getDataSourceById(tableDataSourceId);
  const columns = useMemo(
    () => tableDataSource?.columnDefs || [],
    [tableDataSource?.columnDefs],
  );
  const children = useMemo(() => filter.children || [], [filter.children]);

  // Delayed filter update for better UI response
  const setFilter = useCallback(
    (f: RecordFilterInput) => {
      setTimeout(() => {
        _setFilter(f);
      }, 1);
    },
    [_setFilter],
  );

  const filterRef = useRef(filter);
  const childrenRef = useRef(children);

  // Update refs when values change
  useEffect(() => {
    filterRef.current = filter;
    childrenRef.current = children;
  }, [filter, children]);

  useEffect(() => {
    // Clean up filters when referenced items are removed
    const validChildren = children.filter((child) => {
      if (child.type === FilterType.GEO) {
        // Check if placed marker still exists
        if (
          child.placedMarker &&
          !placedMarkers.find((m) => m.id === child.placedMarker)
        ) {
          return false;
        }

        // Check if turf still exists
        if (child.turf && !turfs?.find((t) => t.id === child.turf)) {
          return false;
        }

        // Check if data source is still enabled in mapConfig (for member/marker collections)
        if (child.dataSourceId) {
          const isMemberSource =
            child.dataSourceId === mapConfig?.membersDataSourceId;
          const isMarkerSource = mapConfig?.markerDataSourceIds?.includes(
            child.dataSourceId,
          );

          if (!isMemberSource && !isMarkerSource) return false;
        }
      }
      return true;
    });

    // Only update if we actually removed some filters
    if (validChildren.length !== children.length) {
      const updatedFilter = { ...filterRef.current, children: validChildren };
      setFilter(updatedFilter);
    }
  }, [children, placedMarkers, turfs, mapConfig, setFilter]);

  const setChildFilter = (index: number, childFilter: RecordFilterInput) => {
    const updatedFilter = {
      ...filter,
      children: children.map((f, i) => (i === index ? childFilter : f)),
    };
    setFilter(updatedFilter);
  };

  const addFilter = useCallback(
    (childFilter: RecordFilterInput) => {
      const newFilter = { ...filter, children: [...children, childFilter] };
      setFilter(newFilter);
    },
    [children, filter, setFilter],
  );

  const removeFilter = (index: number) => {
    const updatedFilter = {
      ...filter,
      children: children.filter((_, i) => i !== index),
    };
    setFilter(updatedFilter);
  };

  const updateOperator = (useAnd: boolean) => {
    const updatedFilter = {
      ...filter,
      operator: useAnd ? FilterOperator.AND : FilterOperator.OR,
    };
    setFilter(updatedFilter);
  };

  // Build dropdown items
  const dropdownItems = useMemo(
    () =>
      buildDropdownItems({
        mapConfig,
        getDataSourceById,
        placedMarkers,
        turfs: turfs || [],
        columns,
        addFilter,
      }),
    [mapConfig, getDataSourceById, placedMarkers, turfs, columns, addFilter],
  );

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
              preventAutoFocus
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
  onOperatorChange,
}: {
  operator: FilterOperator;
  onOperatorChange: (useAnd: boolean) => void;
}) {
  return (
    <Toggle
      pressed={operator === FilterOperator.AND}
      onPressedChange={onOperatorChange}
    >
      <span className="text-sm text-muted-foreground font-normal">
        {operator === FilterOperator.AND ? (
          <span>
            Match <span className="text-muted-foreground">Any</span> |{" "}
            <span className="font-medium text-primary">All</span>
          </span>
        ) : (
          <span>
            Match <span className="font-medium text-primary">Any</span> |{" "}
            <span className="text-muted-foreground">All</span>
          </span>
        )}
      </span>
    </Toggle>
  );
}

// Extracted child filter component
function ChildFilter({ filter, setFilter }: TableFilterProps) {
  const { mapConfig } = useMapConfig();
  const color = getFilterColor(filter, mapConfig);
  const hasDistance = filter.placedMarker || filter.dataRecordId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (!filter.search) {
        inputRef.current?.focus();
      }
    }, 100);
  }, [filter.search]);

  const updateFilter = useCallback(
    (updates: Partial<RecordFilterInput>) => {
      setFilter({ ...filter, ...updates });
    },
    [filter, setFilter],
  );

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

        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="whitespace-nowrap max-w-[100px] truncate pr-2 font-medium">
          {filter.label || "Unnamed location"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-center">
      <span className="text-muted-foreground whitespace-nowrap">
        {filter.column} is
      </span>
      <Input
        type="text"
        placeholder="Search"
        value={filter.search || ""}
        onChange={(e) => updateFilter({ search: e.target.value })}
        className="w-20 h-7 p-2 text-sm text-center border-y-0 border-r-0 rounded-none bg-neutral-100 font-medium"
        ref={inputRef}
        required
      />
    </div>
  );
}

// Extracted distance input component
function DistanceInput({
  value,
  onChange,
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
      <span className="whitespace-nowrap text-muted-foreground px-1">
        km of
      </span>
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

  const trpc = useTRPC();
  const { data: dataSource, isPending } = useQuery(
    trpc.dataSource.byIdWithRecords.queryOptions(
      { dataSourceId, search },
      { placeholderData: keepPreviousData },
    ),
  );
  const getItemLabel = useCallback(
    (record: DataRecord) => {
      const nameColumns = dataSource?.columnRoles.nameColumns;
      if (!nameColumns?.length) return record.externalId;

      const label = nameColumns
        .map((column) => record.json[column])
        .map((name) => (typeof name === "string" ? name.trim() : null))
        .filter(Boolean)
        .join(" ");

      return label || record.externalId;
    },
    [dataSource?.columnRoles.nameColumns],
  );

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={`Search ${label}`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isPending
            ? "Loading"
            : search
              ? "No results found."
              : "Type to search..."}
        </CommandEmpty>
        {!search && dataSource?.count && dataSource.records.length > 5 && (
          <div className="px-2 pt-1 text-[10px] text-muted-foreground text-center">
            Type to search all {dataSource.count.total} records
          </div>
        )}

        {dataSource?.records && dataSource?.records.length > 0 && (
          <CommandGroup
            heading={
              dataSource?.records && dataSource?.records.length > 0
                ? search
                  ? "Search Results"
                  : "Recent Records"
                : ""
            }
          >
            {dataSource?.records.map((record) => (
              <CommandItem
                key={record.id}
                className="cursor-pointer"
                onSelect={() => onSelectRecord(record.id, getItemLabel(record))}
              >
                {getItemLabel(record)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}

// Helper functions
function getFilterColor(
  filter: RecordFilterInput,
  mapConfig: MapConfig,
): string {
  if (filter.placedMarker) return mapColors.markers.color;
  if (filter.turf) return mapColors.areas.color;
  if (filter.dataSourceId && filter.dataRecordId) {
    // Check if this is a marker collection (not a member data source)
    const isMarkerCollection =
      filter.dataSourceId !== mapConfig?.membersDataSourceId;
    return isMarkerCollection
      ? mapColors.markers.color
      : mapColors.member.color;
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
  mapConfig: MapConfig;
  getDataSourceById: (id: string) => { id: string; name: string } | null;
  placedMarkers: PlacedMarker[];
  turfs: Turf[];
  columns: ColumnDef[];
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

  const markerCommands = mapConfig.markerDataSourceIds.map(
    (dataSourceId: string) => {
      const markerDataSource = getDataSourceById(dataSourceId);
      return {
        label: markerDataSource?.name || "Unknown data source",
        component: (
          <DataRecordCommand
            key={dataSourceId}
            label={markerDataSource?.name || "Unknown data source"}
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
    },
  );

  const placedMarkerItems: DropdownMenuItemType[] = placedMarkers.map(
    (marker) => ({
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
    }),
  );

  const turfItems: DropdownMenuItemType[] = turfs.map((turf) => ({
    type: "item",
    label: turf.label || `Area: ${turf.area?.toFixed(2)}m²`,
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
    ...(memberCommand
      ? [
          {
            type: "subcomponent",
            label: (
              <div className="flex gap-1 items-center">
                <span className="text-muted-foreground whitespace-nowrap">
                  Proximity to
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: mapColors.member.color }}
                />
                <span className="font-medium text-primary">Member</span>
              </div>
            ),
            component: memberCommand,
          } as DropdownSubComponent,
        ]
      : []),

    // Marker Area
    //If there is an placed markers or marker collection data, show the markers in a submenu
    ...(markerCommands.length || placedMarkerItems.length > 0
      ? [
          {
            type: "submenu",
            label: (
              <div className="flex gap-1 items-center">
                <span className="text-muted-foreground whitespace-nowrap">
                  Proximity to
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: mapColors.markers.color }}
                />
                <span className="font-medium text-primary">Marker</span>
              </div>
            ),
            items: [
              //if theres is placed markers, show the markers in a submenu
              ...(placedMarkerItems.length > 0 ? [...placedMarkerItems] : []),

              //if theres is placed markers and marker collection data, show a separator
              ...(markerCommands.length > 0 && placedMarkerItems.length > 0
                ? [{ type: "separator" }]
                : []),

              //if theres is marker collection data, show the markers in a submenu
              ...(markerCommands.length > 0
                ? markerCommands.map(
                    ({
                      label,
                      component,
                    }: {
                      label: string;
                      component: React.ReactNode;
                    }) =>
                      ({
                        type: "subcomponent",
                        label,
                        component,
                      }) as DropdownSubComponent,
                  )
                : []),
            ],
          } as DropdownSubMenu,
        ]
      : []),

    // Area Data
    ...(turfItems.length > 0
      ? [
          {
            type: "submenu",
            label: (
              <div className="flex gap-1 items-center">
                <span className="text-muted-foreground whitespace-nowrap">
                  Within
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: mapColors.areas.color }}
                />
                <span className="font-medium text-primary">Area</span>
              </div>
            ),
            items: turfItems,
          } as DropdownSubMenu,
        ]
      : []),

    { type: "separator" },
    ...columnItems,
  ];
}
