"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { ColumnDisplayFormatLabels } from "@/labels";
import { ColumnDisplayFormat } from "@/models/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import type { ReactNode } from "react";

// What each format is for, with a small example of how it looks
const FORMAT_DETAILS: Record<
  ColumnDisplayFormat,
  { description: string; example: ReactNode }
> = {
  [ColumnDisplayFormat.Text]: {
    description: "The value as written.",
    example: <span className="font-medium">Labour</span>,
  },
  [ColumnDisplayFormat.Number]: {
    description: "Formatted with thousands separators.",
    example: <span className="font-medium tabular-nums">12,345</span>,
  },
  [ColumnDisplayFormat.Percentage]: {
    description: "A bar out of 100%, for shares and rates.",
    example: (
      <span className="flex w-24 items-center gap-1.5">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
          <span className="block h-full w-[62%] rounded-full bg-neutral-800" />
        </span>
        <span className="font-medium tabular-nums">62%</span>
      </span>
    ),
  },
  [ColumnDisplayFormat.Scale]: {
    description: "Filled blocks out of a maximum, for scores and ratings.",
    example: (
      <span className="flex w-20 gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-sm",
              i <= 3 ? "bg-neutral-800" : "bg-neutral-200",
            )}
          />
        ))}
      </span>
    ),
  },
  [ColumnDisplayFormat.NumberWithComparison]: {
    description:
      "The value against the average, median, lowest or highest across all records.",
    example: (
      <span className="flex items-baseline gap-1.5">
        <span className="font-medium tabular-nums">12,345</span>
        <span className="text-[10px] font-medium text-green-700">
          +4.2% avg
        </span>
      </span>
    ),
  },
  [ColumnDisplayFormat.Boolean]: {
    description: "A tick or cross, for yes/no values.",
    example: (
      <span className="flex items-center gap-1 font-medium">
        <CheckIcon className="size-3 text-green-700" />
        Yes
      </span>
    ),
  },
  [ColumnDisplayFormat.LargeText]: {
    description: "Full width, for notes and descriptions.",
    example: (
      <span className="flex w-24 flex-col gap-1">
        <span className="h-1 w-full rounded-full bg-neutral-300" />
        <span className="h-1 w-2/3 rounded-full bg-neutral-300" />
      </span>
    ),
  },
};

// The column format as a picker that explains each option: its name, what
// it's for and a small example, instead of a bare list of names
export default function ColumnFormatPicker({
  value,
  formats,
  onChange,
}: {
  value: ColumnDisplayFormat | undefined;
  /** The formats this column's type allows */
  formats: ColumnDisplayFormat[];
  onChange: (format: ColumnDisplayFormat | undefined) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const options: {
    value: ColumnDisplayFormat | undefined;
    label: string;
    description: string;
    example?: ReactNode;
  }[] = [
    {
      value: undefined,
      label: "Default",
      description: "Chosen from the column's type.",
    },
    ...formats.map((format) => ({
      value: format,
      label: ColumnDisplayFormatLabels[format],
      ...FORMAT_DETAILS[format],
    })),
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        aria-label="Display format"
        className="flex h-6 w-[8.5rem] shrink-0 cursor-pointer items-center justify-between gap-1 rounded border border-input bg-background px-1.5 text-left text-xs hover:border-neutral-300"
      >
        <span className="truncate">
          {value ? ColumnDisplayFormatLabels[value] : "Default format"}
        </span>
        <ChevronDownIcon className="size-3 shrink-0 text-neutral-400" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-1">
        <ul role="listbox" aria-label="Display format">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value ?? "default"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 text-left hover:bg-neutral-100",
                    isSelected && "bg-neutral-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-xs font-medium text-neutral-900">
                      {option.label}
                      {isSelected && <CheckIcon className="size-3" />}
                    </span>
                    <span className="block text-[11px] leading-snug text-neutral-500">
                      {option.description}
                    </span>
                  </span>
                  {option.example && (
                    <span className="mt-0.5 flex shrink-0 items-center rounded border border-neutral-200 bg-white px-1.5 py-1 text-[11px] text-neutral-800">
                      {option.example}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
