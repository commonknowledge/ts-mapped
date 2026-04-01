import { ChevronDown, InfoIcon } from "lucide-react";
import { useState } from "react";
import { ColumnType } from "@/models/DataSource";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import type { DataSource } from "@/models/DataSource";

export function IncludeColumnsModal({
  dataSource,
  selectedColumns,
  onColumnsChange,
}: {
  dataSource: DataSource;
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const numericColumns = dataSource.columnDefs.filter(
    (c) => c.type === ColumnType.Number,
  );

  const handleToggle = (columnName: string, checked: boolean) => {
    if (checked) {
      onColumnsChange([...selectedColumns, columnName]);
    } else {
      onColumnsChange(selectedColumns.filter((c) => c !== columnName));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono font-medium uppercase text-neutral-500">
            Include columns
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon
                className="h-3.5 w-3.5 shrink-0 cursor-help text-neutral-500"
                aria-label="Include columns info"
                tabIndex={0}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64">
              <p>
                Select which columns to include when finding the highest value.
                Leave blank to use all numeric columns.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-2 px-2 shadow-none"
          >
            <div className="text-left min-w-0 flex-1">
              <div className="text-xs font-normal truncate">
                {selectedColumns.length > 0
                  ? `${selectedColumns.length} column${
                      selectedColumns.length !== 1 ? "s" : ""
                    } selected`
                  : "All numeric columns"}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select columns to include</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <p className="text-sm text-gray-500 mb-4">
            Only selected columns will be considered when determining the
            highest value column for each area. Leave empty to use all numeric
            columns.
          </p>
          <div className="space-y-2">
            {numericColumns.map((column) => (
              <div
                key={column.name}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
              >
                <Checkbox
                  id={`column-${column.name}`}
                  checked={selectedColumns.includes(column.name)}
                  onCheckedChange={(checked) =>
                    handleToggle(column.name, checked === true)
                  }
                />
                <label
                  htmlFor={`column-${column.name}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {column.name}
                </label>
              </div>
            ))}
          </div>
          {numericColumns.length === 0 && (
            <p className="text-sm text-gray-500">
              No numeric columns found in this data source.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
