import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import type { ColumnDef } from "@/__generated__/types";

export default function ColumnsMultiSelect({
  buttonClassName,
  columns,
  columnDefs,
  onChange,
}: {
  buttonClassName?: string;
  columns: string[];
  columnDefs: ColumnDef[];
  onChange: (columns: string[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(buttonClassName, "inline truncate")}
          variant="outline"
        >
          {columns.length ? columns.join(", ") : "Select columns"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {columnDefs.map((cd) => (
          <DropdownMenuCheckboxItem
            key={cd.name}
            checked={columns.includes(cd.name)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange(columns.concat([cd.name]));
              } else {
                onChange(columns.filter((c) => c !== cd.name));
              }
            }}
          >
            {cd.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
