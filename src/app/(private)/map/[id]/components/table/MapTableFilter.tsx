import { gql, useQuery } from "@apollo/client";
import { FilterIcon, XIcon } from "lucide-react";
import { useContext, useState } from "react";
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
  const columns = tableDataSource?.columnDefs || [];

  // Put filter updates on a timeout for better UI responsiveness
  const setFilter = (f: RecordFilterInput) => {
    setTimeout(() => {
      _setFilter(f);
    }, 1);
  };

  const children = filter.children || [];
  const setChildFilter = (index: number, childFilter: RecordFilterInput) => {
    setFilter({
      ...filter,
      children: children.map((f, i) => {
        if (i === index) {
          return childFilter;
        }
        return f;
      }),
    });
  };

  const addFilter = (childFilter: RecordFilterInput) => {
    setFilter({ ...filter, children: children.concat([childFilter]) });
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
              });
            }}
          />
        ),
      };
    },
  );

  const dropdownItems = [
    {
      type: "subcomponent",
      label: "Members",
      component: memberCommand,
    } as DropdownSubComponent,
    {
      type: "submenu",
      label: "Markers",
      items: labelledMarkerCommands.map(
        ({ label, component }) =>
          ({
            type: "subcomponent",
            label,
            component,
          }) as DropdownSubComponent,
      ),
    } as DropdownSubMenu,
    {
      type: "submenu",
      label: "Locations",
      items: placedMarkerItems,
    } as DropdownSubMenu,
    {
      type: "submenu",
      label: "Areas",
      items: turfItems,
    } as DropdownSubMenu,
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
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <MultiDropdownMenu
          align="start"
          side="bottom"
          dropdownLabel="Filters"
          dropdownItems={dropdownItems}
        >
          Filter <FilterIcon className="w-4 h-4" />
        </MultiDropdownMenu>
        <ul className="flex gap-2 items-center">
          {children.map((child, i) => (
            <li key={i} className="flex gap-1 items-center">
              <ChildFilter
                filter={child}
                setFilter={(child) => setChildFilter(i, child)}
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setFilter({
                    ...filter,
                    children: filter.children?.filter((_, j) => i !== j),
                  });
                }}
              >
                <XIcon className="w-2 h-2" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <Toggle
          pressed={filter.operator !== FilterOperator.OR}
          onPressedChange={(value) =>
            setFilter({
              ...filter,
              operator: value ? FilterOperator.AND : FilterOperator.OR,
            })
          }
        >
          <span>
            {filter.operator === FilterOperator.OR ? "Match any" : "Match all"}
          </span>
        </Toggle>
      </div>
    </div>
  );
}

function ChildFilter({ filter, setFilter }: TableFilterProps) {
  const hasDistance = filter.placedMarker || filter.dataRecordId;
  return (
    <div className="flex gap-1 items-center">
      {filter.type === FilterType.GEO ? (
        <>
          <span>within</span>
          {hasDistance && (
            <>
              <Input
                type="number"
                placeholder="Distance"
                value={filter.distance || 0}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    distance: parseInt(e.target.value, 10) || 0,
                  })
                }
                required
              />
              <span className="whitespace-nowrap">km of</span>
            </>
          )}
          <span>{filter.label || "Unknown location"}</span>
        </>
      ) : (
        <>
          <span>{filter.column}</span>
          <span>is</span>
          <Input
            type="text"
            placeholder="Search"
            value={filter.search || ""}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
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
    { variables: { dataSourceId, search } },
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
