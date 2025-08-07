import { FilterIcon, XIcon } from "lucide-react";
import {
  ColumnDef,
  FilterType,
  PlacedMarker,
  RecordFilterInput,
  Turf,
} from "@/__generated__/types";
import MultiDropdownMenu, {
  DropdownItem,
  DropdownMenuItemType,
  DropdownSeparator,
  DropdownSubMenu,
} from "@/components/MultiDropdownMenu";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

interface TableFilterProps {
  columns: ColumnDef[];
  placedMarkers: PlacedMarker[];
  turfs: Turf[];
  filter: RecordFilterInput;
  setFilter: (f: RecordFilterInput) => void;
}

export default function TableFilter({
  columns,
  placedMarkers,
  turfs,
  filter,
  setFilter,
}: TableFilterProps) {
  return (
    <div>
      <MultiFilter
        filter={filter}
        columns={columns}
        setFilter={setFilter}
        placedMarkers={placedMarkers}
        turfs={turfs}
      />
    </div>
  );
}

function MultiFilter({
  columns,
  filter,
  setFilter,
  placedMarkers,
  turfs,
}: TableFilterProps) {
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
        });
      },
    };
  });

  const dropdownItems = [
    {
      type: "submenu",
      label: "Locations",
      items: placedMarkerItems
        .concat([{ type: "separator" }])
        .concat(turfItems),
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
              columns={columns}
              setFilter={(child) => setChildFilter(i, child)}
              placedMarkers={placedMarkers}
              turfs={turfs}
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
  );
}

function ChildFilter({
  filter,
  setFilter,
  placedMarkers,
  turfs,
}: TableFilterProps) {
  const getMarkerOrTurf = () => {
    return (
      placedMarkers.find((m) => m.id === filter.placedMarker) ||
      turfs.find((t) => t.id === filter.turf)
    );
  };

  return (
    <div className="flex gap-1 items-center">
      {filter.type === FilterType.GEO ? (
        <>
          <span>within</span>
          {filter.placedMarker && (
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
          <span>{getMarkerOrTurf()?.label || "Unknown location"}</span>
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
