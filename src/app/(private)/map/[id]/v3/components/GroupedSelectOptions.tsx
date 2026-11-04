"use client";

import {
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "@/shadcn/ui/select";

export interface OptionGroup {
  label: string;
  options: { value: string; name: string; description: string }[];
}

// A select's options under group headings, each with a line describing it;
// shared by the boundary pickers so they read the same
export default function GroupedSelectOptions({
  groups,
  separateFirst = false,
}: {
  groups: OptionGroup[];
  /** Rule above the first group too, e.g. after a "None" option */
  separateFirst?: boolean;
}) {
  return groups.map((group, index) => (
    <SelectGroup key={group.label}>
      {(index > 0 || separateFirst) && <SelectSeparator />}
      <SelectLabel className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
        {group.label}
      </SelectLabel>
      {group.options.map((option) => (
        <SelectItem key={option.value} value={option.value} className="py-1">
          <span className="flex min-w-0 flex-col items-start gap-0">
            <span className="text-xs">{option.name}</span>
            <span className="text-[11px] text-neutral-500">
              {option.description}
            </span>
          </span>
        </SelectItem>
      ))}
    </SelectGroup>
  ));
}
