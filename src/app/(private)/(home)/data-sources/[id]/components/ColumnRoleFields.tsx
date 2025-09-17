import { Check } from "lucide-react";
import { useState } from "react";

import CustomMultiSelect from "@/components/forms/CustomMultiSelect";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { DropdownMenuContent } from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import type { RouterOutputs } from "@/services/trpc/react";

export function ColumnRoleFields({
  dataSource,
  nameColumns,
  setNameColumns,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
  nameColumns: string[];
  setNameColumns: (ncs: string[]) => void;
}) {
  const [search, setSearch] = useState("");

  const onSelect = (currentValue: string) => {
    if (nameColumns.some((c) => c === currentValue)) {
      setNameColumns(nameColumns.filter((c) => c !== currentValue));
    } else {
      setNameColumns(nameColumns.concat([currentValue]));
    }

    setSearch("");
  };

  return (
    <CustomMultiSelect
      id="config-name-columns-multi"
      label="Name columns"
      hint="Select one or more fields to use as labels on the map."
      selectedOptions={nameColumns}
    >
      <DropdownMenuContent align="start">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No value found.</CommandEmpty>
            <CommandGroup>
              {dataSource?.columnDefs.map((cd) => (
                <CommandItem
                  key={cd.name}
                  value={cd.name}
                  onSelect={(currentValue: string) => onSelect(currentValue)}
                >
                  {cd.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      nameColumns.some((c) => c === cd.name)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </CustomMultiSelect>
  );
}
