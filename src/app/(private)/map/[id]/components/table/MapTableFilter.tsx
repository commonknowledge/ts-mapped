import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ListFilter,
  ListIcon,
  MapPinIcon,
  Search,
  SquareDashedIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAreaLists } from "@/app/(private)/map/[id]/hooks/useAreaLists";
import { useMapConfig } from "@/app/(private)/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/(private)/map/[id]/hooks/useMapViews";
import { useMarkerColors } from "@/app/(private)/map/[id]/hooks/useMarkerColors";
import { usePlacedMarkersQuery } from "@/app/(private)/map/[id]/hooks/usePlacedMarkers";
import { useTable } from "@/app/(private)/map/[id]/hooks/useTable";
import { useTurfsQuery } from "@/app/(private)/map/[id]/hooks/useTurfsQuery";
import MultiDropdownMenu from "@/components/MultiDropdownMenu";
import { useDataSources } from "@/hooks/useDataSources";
import { FilterTypeLabels } from "@/labels";
import {
  FilterOperator,
  FilterType,
  columnFilterTypes,
} from "@/models/MapView";
import { useTRPC } from "@/services/trpc/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { Label } from "@/shadcn/ui/label";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";
import { buildName } from "@/utils/dataRecord";
import { mapColors } from "../../styles";
import { getTurfDisplayName } from "../../utils/turf";
import type {
  DropdownItem,
  DropdownMenuItemType,
  DropdownSubComponent,
  DropdownSubMenu,
} from "@/components/MultiDropdownMenu";
import type { DataRecord } from "@/models/DataRecord";
import type { ColumnDef } from "@/models/DataSource";
import type { AreaList } from "@/models/Map";
import type { RecordFilterInput } from "@/models/MapView";
import type { PlacedMarker } from "@/models/PlacedMarker";
import type { Turf } from "@/models/Turf";

interface TableFilterProps {
  filter: RecordFilterInput;
  setFilter: (f: RecordFilterInput) => void;
  search?: string;
  setSearch?: (search: string) => void;
}

/** A marker layer on the map, by its own name and colour */
interface MarkerLayer {
  dataSourceId: string;
  name: string;
  color: string;
}

const CHIP_CLASSES =
  "flex h-7 items-center overflow-hidden rounded-md border border-neutral-200 bg-white text-xs";

// The table header's search, filter menu and active filters
export default function MapTableFilter({
  filter,
  setFilter: _setFilter,
  search,
  setSearch,
}: TableFilterProps) {
  const { mapConfig } = useMapConfig();
  const { viewConfig, updateViewConfig } = useMapViews();
  const { data: turfs = [] } = useTurfsQuery();
  const { data: placedMarkers = [] } = usePlacedMarkersQuery();
  const { lists } = useAreaLists();
  const { markerColors } = useMarkerColors();
  const { getDataSourceById } = useDataSources();
  const { selectedDataSourceId: tableDataSourceId } = useTable();

  const tableDataSource = getDataSourceById(tableDataSourceId);
  const columns = useMemo(
    () => tableDataSource?.columnDefs || [],
    [tableDataSource?.columnDefs],
  );
  const children = useMemo(() => filter.children || [], [filter.children]);

  const markerLayers = useMemo<MarkerLayer[]>(() => {
    const ids = [
      ...(mapConfig.membersDataSourceId ? [mapConfig.membersDataSourceId] : []),
      ...mapConfig.markerDataSourceIds,
    ];
    return ids.map((dataSourceId) => {
      const dataSource = getDataSourceById(dataSourceId);
      return {
        dataSourceId,
        name: dataSource?.name || "Unknown data source",
        color:
          markerColors[dataSourceId] ??
          dataSource?.defaultMarkerColor ??
          (dataSourceId === mapConfig.membersDataSourceId
            ? mapColors.member.color
            : mapColors.markers.color),
      };
    });
  }, [
    getDataSourceById,
    mapConfig.markerDataSourceIds,
    mapConfig.membersDataSourceId,
    markerColors,
  ]);

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
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    // Drop filters whose marker, area, layer or list has gone, and keep list
    // filters in step with their list's areas
    let changed = false;
    const nextChildren = children.flatMap((child) => {
      if (child.type !== FilterType.GEO) return [child];
      if (
        child.placedMarker &&
        !placedMarkers.find((m) => m.id === child.placedMarker)
      ) {
        changed = true;
        return [];
      }
      if (child.turf && !turfs.find((t) => t.id === child.turf)) {
        changed = true;
        return [];
      }
      if (
        child.dataSourceId &&
        !markerLayers.some((l) => l.dataSourceId === child.dataSourceId)
      ) {
        changed = true;
        return [];
      }
      if (child.areaListId) {
        const list = lists.find((l) => l.id === child.areaListId);
        if (!list) {
          changed = true;
          return [];
        }
        const areaCodes = list.areas.map((a) => a.code);
        if (
          child.label !== list.name ||
          child.areaSetCode !== list.areaSetCode ||
          areaCodes.join(",") !== (child.areaCodes ?? []).join(",")
        ) {
          changed = true;
          return [toListFilter(list)];
        }
      }
      return [child];
    });
    if (changed) {
      setFilter({ ...filterRef.current, children: nextChildren });
    }
  }, [children, placedMarkers, turfs, markerLayers, lists, setFilter]);

  const setChildFilter = (index: number, childFilter: RecordFilterInput) => {
    setFilter({
      ...filter,
      children: children.map((f, i) => (i === index ? childFilter : f)),
    });
  };

  const addFilter = useCallback(
    (childFilter: RecordFilterInput) => {
      setFilter({ ...filter, children: [...children, childFilter] });
    },
    [children, filter, setFilter],
  );

  const removeFilter = (index: number) => {
    setFilter({
      ...filter,
      children: children.filter((_, i) => i !== index),
    });
  };

  const dropdownItems = useMemo(
    () =>
      buildDropdownItems({
        markerLayers,
        placedMarkers,
        placedMarkerColors: mapConfig.placedMarkerColors,
        turfs,
        lists,
        columns,
        addFilter,
      }),
    [
      markerLayers,
      placedMarkers,
      mapConfig.placedMarkerColors,
      turfs,
      lists,
      columns,
      addFilter,
    ],
  );

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {setSearch && <SearchInput search={search} setSearch={setSearch} />}
      <MultiDropdownMenu
        align="start"
        side="bottom"
        dropdownLabel="Filter by"
        dropdownItems={dropdownItems}
        variant="outline"
        buttonSize="sm"
        buttonClassName="h-7 gap-1.5 px-2 text-xs font-normal"
        preventAutoFocus
      >
        <ListFilter className="size-3.5" />
        Filter
        {children.length > 0 && (
          <span className="rounded bg-neutral-900 px-1 text-[10px] leading-4 font-medium text-white tabular-nums">
            {children.length}
          </span>
        )}
      </MultiDropdownMenu>

      {children.map((child, i) => (
        <div key={i} className={CHIP_CLASSES}>
          <ChildFilter
            filter={child}
            setFilter={(child) => setChildFilter(i, child)}
            markerLayers={markerLayers}
            lists={lists}
          />
          <button
            type="button"
            aria-label="Remove filter"
            onClick={() => removeFilter(i)}
            className="flex h-full cursor-pointer items-center border-l border-neutral-200 px-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}

      {children.length > 1 && (
        <OperatorToggle
          operator={filter.operator || FilterOperator.OR}
          onOperatorChange={(useAnd) =>
            setFilter({
              ...filter,
              operator: useAnd ? FilterOperator.AND : FilterOperator.OR,
            })
          }
        />
      )}

      {(children.length > 0 || search) && (
        <div className="ml-1 flex items-center gap-1.5">
          <Switch
            id="hide-filtered-markers"
            checked={Boolean(viewConfig.hideFilteredMarkers)}
            onCheckedChange={(checked) =>
              updateViewConfig({ hideFilteredMarkers: checked })
            }
          />
          <Label
            htmlFor="hide-filtered-markers"
            className="cursor-pointer text-xs font-normal whitespace-nowrap text-neutral-500"
          >
            Hide the rest on the map
          </Label>
        </div>
      )}
    </div>
  );
}

const toListFilter = (list: AreaList): RecordFilterInput => ({
  type: FilterType.GEO,
  areaListId: list.id,
  areaSetCode: list.areaSetCode,
  areaCodes: list.areas.map((a) => a.code),
  label: list.name,
});

function SearchInput({
  search,
  setSearch,
}: {
  search?: string;
  setSearch: (search: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState(search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(search ?? "");
  }, [search]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  };

  return (
    <div className="flex h-7 w-44 items-center gap-1.5 rounded-md border border-neutral-200 bg-white pr-1 pl-2 focus-within:border-neutral-400">
      <Search className="size-3.5 shrink-0 text-neutral-400" />
      <input
        type="text"
        placeholder="Search"
        aria-label="Search records"
        value={localSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-neutral-400"
      />
      {localSearch && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setLocalSearch("");
            setSearch("");
          }}
          className="cursor-pointer rounded p-0.5 text-neutral-400 hover:text-neutral-900"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  );
}

function OperatorToggle({
  operator,
  onOperatorChange,
}: {
  operator: FilterOperator;
  onOperatorChange: (useAnd: boolean) => void;
}) {
  return (
    <div className="flex h-7 items-center rounded-md bg-neutral-100 p-0.5 text-xs">
      {[
        { useAnd: false, label: "Any" },
        { useAnd: true, label: "All" },
      ].map(({ useAnd, label }) => {
        const isActive = (operator === FilterOperator.AND) === useAnd;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={isActive}
            onClick={() => onOperatorChange(useAnd)}
            className={cn(
              "h-full cursor-pointer rounded px-2",
              isActive
                ? "bg-white font-medium text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900",
            )}
          >
            Match {label.toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}

function ChildFilter({
  filter,
  setFilter,
  markerLayers,
  lists,
}: {
  filter: RecordFilterInput;
  setFilter: (f: RecordFilterInput) => void;
  markerLayers: MarkerLayer[];
  lists: AreaList[];
}) {
  const { mapConfig } = useMapConfig();
  const hasDistance = filter.placedMarker || filter.dataRecordId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!filter.search) {
        inputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [filter.search]);

  const updateFilter = useCallback(
    (updates: Partial<RecordFilterInput>) => {
      setFilter({ ...filter, ...updates });
    },
    [filter, setFilter],
  );

  const [localSearch, setLocalSearch] = useState(filter.search || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(filter.search || "");
  }, [filter.search]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateFilter({ search: value });
    }, 300);
  };

  if (filter.type === FilterType.GEO) {
    const list = filter.areaListId
      ? lists.find((l) => l.id === filter.areaListId)
      : undefined;
    const color = list
      ? list.color
      : filter.turf
        ? mapColors.areas.color
        : filter.placedMarker
          ? (mapConfig.placedMarkerColors?.[filter.placedMarker] ??
            mapColors.markers.color)
          : (markerLayers.find((l) => l.dataSourceId === filter.dataSourceId)
              ?.color ?? mapColors.markers.color);

    return (
      <div className="flex h-full items-center gap-1.5 pl-2">
        <span className="text-neutral-500">
          {list ? "In" : hasDistance ? "Within" : "Inside"}
        </span>
        {hasDistance && (
          <>
            <input
              type="number"
              aria-label="Distance in km"
              min={0}
              value={filter.distance || 0}
              onChange={(e) =>
                updateFilter({ distance: parseInt(e.target.value, 10) || 0 })
              }
              className="always-show-spinner h-5 w-10 rounded bg-neutral-100 text-center font-medium tabular-nums outline-none"
            />
            <span className="text-neutral-500">km of</span>
          </>
        )}
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0",
            list ? "rounded-sm" : "rounded-full",
          )}
          style={{ backgroundColor: color }}
        />
        <span className="max-w-[140px] truncate pr-2 font-medium">
          {filter.label || "Unnamed location"}
        </span>
      </div>
    );
  }

  const needsSearch =
    filter.type !== FilterType.EMPTY && filter.type !== FilterType.NOT_EMPTY;

  return (
    <div className="flex h-full items-center">
      <span className="pr-1.5 pl-2 whitespace-nowrap text-neutral-500">
        {filter.column}
      </span>
      <select
        aria-label="Filter type"
        value={filter.type}
        onChange={(e) => {
          const newType = e.target.value as FilterType;
          const keepsSearch =
            newType !== FilterType.EMPTY && newType !== FilterType.NOT_EMPTY;
          updateFilter({
            type: newType,
            search: keepsSearch ? filter.search : undefined,
          });
        }}
        className="h-full cursor-pointer border-l border-neutral-200 bg-neutral-50 px-1 font-medium outline-none"
      >
        {columnFilterTypes.map((type) => (
          <option key={type} value={type}>
            {FilterTypeLabels[type]}
          </option>
        ))}
      </select>
      {needsSearch && (
        <input
          type="text"
          placeholder="Value"
          aria-label={`${filter.column} value`}
          value={localSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: `${Math.max(6, localSearch.length + 1)}ch` }}
          className="h-full border-l border-neutral-200 px-2 font-medium outline-none placeholder:font-normal placeholder:text-neutral-400"
          ref={inputRef}
        />
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

  const trpc = useTRPC();
  const { data: dataSource, isPending } = useQuery(
    trpc.dataSource.byIdWithRecords.queryOptions(
      { dataSourceId, search },
      { placeholderData: keepPreviousData },
    ),
  );
  const getItemLabel = useCallback(
    (record: DataRecord) => buildName(dataSource, record),
    [dataSource],
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
          <div className="px-2 pt-1 text-center text-[10px] text-muted-foreground">
            Type to search all {dataSource.count.total} records
          </div>
        )}

        {dataSource?.records && dataSource.records.length > 0 && (
          <CommandGroup heading={search ? "Search results" : "Recent records"}>
            {dataSource.records.map((record) => (
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

const Swatch = ({
  color,
  square = false,
}: {
  color: string;
  square?: boolean;
}) => (
  <span
    aria-hidden
    className={cn("size-2 shrink-0", square ? "rounded-sm" : "rounded-full")}
    style={{ backgroundColor: color }}
  />
);

const SwatchLabel = ({
  color,
  label,
  square,
}: {
  color: string;
  label: string;
  square?: boolean;
}) => (
  <span className="flex min-w-0 items-center gap-2">
    <Swatch color={color} square={square} />
    <span className="truncate">{label}</span>
  </span>
);

function buildDropdownItems({
  markerLayers,
  placedMarkers,
  placedMarkerColors,
  turfs,
  lists,
  columns,
  addFilter,
}: {
  markerLayers: MarkerLayer[];
  placedMarkers: PlacedMarker[];
  placedMarkerColors: Record<string, string> | undefined;
  turfs: Turf[];
  lists: AreaList[];
  columns: ColumnDef[];
  addFilter: (filter: RecordFilterInput) => void;
}): DropdownMenuItemType[] {
  // Within a distance of a record from any marker layer, or a placed marker
  const nearItems: DropdownMenuItemType[] = [
    ...markerLayers.map((layer): DropdownSubComponent => ({
      type: "subcomponent",
      label: <SwatchLabel color={layer.color} label={layer.name} />,
      component: (
        <DataRecordCommand
          label={layer.name}
          dataSourceId={layer.dataSourceId}
          onSelectRecord={(id, label) =>
            addFilter({
              type: FilterType.GEO,
              dataRecordId: id,
              dataSourceId: layer.dataSourceId,
              label,
              distance: 1,
            })
          }
        />
      ),
    })),
    ...(markerLayers.length && placedMarkers.length
      ? [{ type: "separator" as const }]
      : []),
    ...placedMarkers.map((marker): DropdownItem => ({
      type: "item",
      label: marker.label,
      icon: (
        <Swatch
          color={placedMarkerColors?.[marker.id] ?? mapColors.markers.color}
        />
      ),
      onClick: () =>
        addFilter({
          type: FilterType.GEO,
          placedMarker: marker.id,
          label: marker.label,
          distance: 1,
        }),
    })),
  ];

  const areaItems: DropdownItem[] = turfs.map((turf) => ({
    type: "item",
    label: getTurfDisplayName(turf),
    icon: <Swatch color={mapColors.areas.color} square />,
    onClick: () =>
      addFilter({ type: FilterType.GEO, turf: turf.id, label: turf.label }),
  }));

  const listItems: DropdownItem[] = lists.map((list) => ({
    type: "item",
    label: `${list.name} (${list.areas.length})`,
    icon: <Swatch color={list.color} square />,
    onClick: () => addFilter(toListFilter(list)),
  }));

  const columnItems: DropdownItem[] = columns.map((column) => ({
    type: "item",
    label: column.name,
    onClick: () => addFilter({ type: FilterType.TEXT, column: column.name }),
  }));

  const submenu = (
    label: string,
    icon: React.ReactNode,
    items: DropdownMenuItemType[],
  ): DropdownSubMenu[] =>
    items.length ? [{ type: "submenu", label, icon, items }] : [];

  const spatialItems = [
    ...submenu("Near", <MapPinIcon className="size-3.5" />, nearItems),
    ...submenu(
      "Inside a drawn area",
      <SquareDashedIcon className="size-3.5" />,
      areaItems,
    ),
    ...submenu("In a list", <ListIcon className="size-3.5" />, listItems),
  ];

  return [
    ...spatialItems,
    ...(spatialItems.length && columnItems.length
      ? [{ type: "separator" as const }]
      : []),
    ...columnItems,
  ];
}
