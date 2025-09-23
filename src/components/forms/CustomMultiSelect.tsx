import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";

import FormFieldWrapper from "./FormFieldWrapper";

export default function CustomMultiSelect({
  id,
  label,
  allOptions,
  selectedOptions,
  onChange,
  hint,
  placeholder = "Select one or more",
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
    <FormFieldWrapper id={id} label={label} hint={hint}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild id={id}>
          <Button
            variant="outline"
            className="max-w-full min-h-[2.5rem] h-auto justify-between text-start font-normal hover:bg-white hover:border-action-hover cursor-auto"
          >
            {selectedOptions?.length ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map((option) => (
                  <Badge key={option} variant="outline">
                    {option}
                  </Badge>
                ))}
              </div>
            ) : (
              placeholder
            )}
            <ChevronDown className="text-muted-foreground opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <Command shouldFilter={enableSearch}>
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
      </DropdownMenu>
    </FormFieldWrapper>
  );
}
