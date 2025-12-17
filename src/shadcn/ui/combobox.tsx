"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/shadcn/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options = [],
      value,
      onValueChange,
      placeholder = "Select an option...",
      searchPlaceholder = "Search...",
      emptyMessage = "No options found.",
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    // Safely find selected label, with validation
    const selectedLabel = React.useMemo(() => {
      if (!value || !options) return undefined;
      const selected = options.find((opt) => opt?.value === value);
      return selected?.label;
    }, [value, options]);

    // Ensure options is always an array
    const safeOptions = Array.isArray(options)
      ? options.filter((opt) => opt && opt.value && opt.label)
      : [];

    const handleSelect = (currentValue: string) => {
      if (typeof onValueChange === "function") {
        onValueChange(currentValue === value ? "" : currentValue);
      }
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{selectedLabel || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {safeOptions.length > 0
                  ? safeOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={handleSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))
                  : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
Combobox.displayName = "Combobox";
