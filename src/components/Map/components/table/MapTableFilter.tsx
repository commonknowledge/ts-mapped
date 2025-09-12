import { gql, useQuery } from "@apollo/client";
import { ListFilter, XIcon } from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterOperator, FilterType } from "@/__generated__/types";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { MarkerAndTurfContext } from "@/components/Map/context/MarkerAndTurfContext";
import { TableContext } from "@/components/Map/context/TableContext";
import MultiDropdownMenu from "@/components/MultiDropdownMenu";
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
import type {
  ColumnDef,
  FilterDataRecordsQuery,
  FilterDataRecordsQueryVariables,
  MapConfig,
  PlacedMarker,
  RecordFilterInput,
  Turf,
} from "@/__generated__/types";
import type {
  DropdownMenuItemType,
  DropdownSubComponent,
  DropdownSubMenu,
} from "@/components/MultiDropdownMenu";

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
  const { mapConfig } = useContext(MapContext);
  const { placedMarkers, turfs } = useContext(MarkerAndTurfContext);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { selectedDataSourceId: tableDataSourceId } = useContext(TableContext);

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
        if (child.turf && !turfs.find((t) => t.id === child.turf)) {
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
        turfs,
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
  const { mapConfig } = useContext(MapContext);
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
          {filter.label || "Unknown location"}
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

  const { data, loading } = useQuery<
    FilterDataRecordsQuery,
    FilterDataRecordsQueryVariables
  >(
    gql`
      query FilterDataRecords($dataSourceId: String!, $search: String) {
        dataSource(id: $dataSourceId) {
          id
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

  const getItemLabel = useCallback(
    (record: { externalId: string; json: Record<string, string> }) => {
      const nameColumns = data?.dataSource?.columnRoles.nameColumns;
      if (!nameColumns?.length) return record.externalId;

      const label = nameColumns
        .map((column) => record.json[column])
        .map((name) => name.trim())
        .filter(Boolean)
        .join(" ");

      return label || record.externalId;
    },
    [data?.dataSource?.columnRoles.nameColumns],
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
          {loading
            ? "Loading"
            : search
              ? "No results found."
              : "Type to search..."}
        </CommandEmpty>
        {displayedRecords.length > 0 ? (
          <CommandGroup heading={search ? "Search Results" : "Recent Records"}>
            {displayedRecords.map((record) => (
              <CommandItem
                key={record.id}
                value={record.id}
                className="p-0 w-full"
              >
                <DropdownMenuItem
                  onClick={() =>
                    onSelectRecord(record.id, getItemLabel(record))
                  }
                  className="w-full cursor-pointer"
                >
                  {getItemLabel(record)}
                </DropdownMenuItem>
              </CommandItem>
            ))}
            {!search &&
              data?.dataSource?.records &&
              data.dataSource.records.length > 5 && (
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
