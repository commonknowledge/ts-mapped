"use client";

import { Check, ChevronsUpDown, InfoIcon } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Merged onto the trigger button (e.g. typography to match Select) */
  triggerClassName?: string;
  size?: React.ComponentProps<typeof Button>["size"];
}

/**
 * Note: this component has been modified from its original version to fix a bug
 * when options contained trailing whitespace. This can happen because the options
 * are derived from the user's data source columns, which can contain whitespace.
 *
 * The modified section is the onSelect handler here:
 *
 *     <CommandItem
 *         key={option.value}
 *         value={option.value}
 *         onSelect={() => handleSelect(option.value)}
 *     >
 */
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options = [],
      value,
      onValueChange,
      placeholder = "Select an option...",
      searchPlaceholder = "Search...",
      emptyMessage = "No options found.",
      triggerClassName,
      size = "default",
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
            size={size}
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", triggerClassName)}
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
                        onSelect={() => handleSelect(option.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {option.hint ? (
                          <>
                            {option.label}
                            <Tooltip>
                              <TooltipTrigger>
                                <InfoIcon
                                  className={`h-3.5 w-3.5 cursor-help text-muted-foreground inline-block`}
                                  aria-label="Column description"
                                  tabIndex={0}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-64">
                                <p className="whitespace-pre-line">
                                  {option.hint}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          option.label
                        )}
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
