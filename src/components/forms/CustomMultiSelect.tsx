import { Check } from "lucide-react";
import { useState } from "react";
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

import CustomMultiSelectWrapper from "./CustomMultiSelectWrapper";

export default function CustomMultiSelect({
  id,
  label,
  allOptions,
  selectedOptions,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  allOptions: string[];
  selectedOptions: string[];
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const enableSearch = allOptions?.length > 3;

  const onSelect = (currentValue: string) => {
    onChange(currentValue);
    setSearch("");
  };

  return (
    <CustomMultiSelectWrapper
      id={id}
      label={label}
      hint={hint}
      selectedOptions={selectedOptions}
    >
      <DropdownMenuContent align="start" className="min-w-[240px] p-0">
        <Command shouldFilter={enableSearch} className="w-full">
          {enableSearch && (
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search..."
              className="h-9"
            />
          )}

          <CommandList>
            <CommandEmpty>No value found.</CommandEmpty>
            <CommandGroup>
              {allOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue: string) => onSelect(currentValue)}
                >
                  {option}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedOptions.some((selected) => selected === option)
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
    </CustomMultiSelectWrapper>
  );
}
