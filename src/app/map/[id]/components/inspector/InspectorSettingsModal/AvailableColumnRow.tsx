"use client";

import { Checkbox } from "@/shadcn/ui/checkbox";
import { cn } from "@/shadcn/utils";

/** Simple row for the Available list: checkbox to add, no drag. */
export function AvailableColumnRow({
  columnName,
  onAdd,
}: {
  columnName: string;
  onAdd: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded py-1.5 pl-1 pr-2 text-sm hover:bg-neutral-100/80",
      )}
    >
      <Checkbox
        checked={false}
        onCheckedChange={(checked) => checked === true && onAdd()}
        aria-label={`Add ${columnName} to columns to show`}
      />
      <span className="truncate font-mono text-xs flex-1">{columnName}</span>
    </div>
  );
}
