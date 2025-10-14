import { Plus, X } from "lucide-react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { PublicMapColumnType } from "@/server/models/PublicMap";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shadcn/ui/select";

interface ColumnCardProps {
  dataSourceId: string;
  badge: string;
  title: string;
  value: string[] | undefined; // Changed to array to support multiple columns
  onValueChange: (value: string[]) => void; // Changed to array
  additionalColumns: {
    label: string;
    sourceColumns: string[];
    type: PublicMapColumnType;
  }[];
  onAdditionalColumnsChange: (
    columns: {
      label: string;
      sourceColumns: string[];
      type: PublicMapColumnType;
    }[],
  ) => void;
}

export default function ColumnCard({
  dataSourceId,
  badge,
  title,
  value,
  onValueChange,
  additionalColumns,
  onAdditionalColumnsChange,
}: ColumnCardProps) {
  const { getDataSourceById } = useDataSources();

  const dataSource = getDataSourceById(dataSourceId);
  const selectedColumns = value || [];
  const hasColumns = selectedColumns.length > 0;

  const addColumn = (columnName: string) => {
    if (columnName && !selectedColumns.includes(columnName)) {
      onValueChange([...selectedColumns, columnName]);
    }
  };

  const removeColumn = (index: number) => {
    const newColumns = selectedColumns.filter((_, i) => i !== index);
    onValueChange(newColumns);
  };

  const updateColumnConfig = (
    updates: Partial<{
      label: string;
      type: PublicMapColumnType;
    }>,
  ) => {
    if (!hasColumns) return;

    // Find or create config for these columns
    const columnIndex = additionalColumns.findIndex(
      (ac) =>
        selectedColumns.every((col) => ac.sourceColumns.includes(col)) &&
        ac.sourceColumns.length === selectedColumns.length,
    );

    if (columnIndex >= 0) {
      const updatedColumns = [...additionalColumns];
      updatedColumns[columnIndex] = {
        ...updatedColumns[columnIndex],
        ...updates,
      };
      onAdditionalColumnsChange(updatedColumns);
    } else {
      // Create new config if it doesn't exist
      const newColumns = [
        ...additionalColumns,
        {
          label: updates.label || selectedColumns.join(" + "),
          sourceColumns: selectedColumns,
          type: updates.type || PublicMapColumnType.String,
        },
      ];
      onAdditionalColumnsChange(newColumns);
    }
  };

  const columnConfig = additionalColumns.find(
    (ac) =>
      selectedColumns.every((col) => ac.sourceColumns.includes(col)) &&
      ac.sourceColumns.length === selectedColumns.length,
  );

  return (
    <div className="border border-neutral-200 rounded-md overflow-hidden">
      {/* Column Header */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            {badge}
          </span>
          <span className="font-medium text-sm whitespace-nowrap">{title}</span>
        </div>
      </div>

      {/* Column Settings - Always expanded */}
      <div className="border-t border-neutral-200 p-3 bg-neutral-50">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center">
            {/* Add Column Select */}
            <Label className="text-xs font-medium w-20">Columns:</Label>
            <div className="flex flex-wrap gap-1 flex-1">
              {/* Selected Columns */}
              {hasColumns && (
                <div className="flex flex-wrap gap-1 items-center">
                  {selectedColumns.map((column, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      <span>{column}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColumn(index)}
                        className="h-3 w-3 p-0 hover:bg-blue-200"
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Column Select - Always show */}
              <Select value="" onValueChange={addColumn}>
                <SelectTrigger className=" text-xs w-auto">
                  <div className="flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {dataSource?.columnDefs
                    .filter((cd) => !selectedColumns.includes(cd.name))
                    .map((cd) => (
                      <SelectItem key={cd.name} value={cd.name}>
                        {cd.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {!hasColumns && (
                <span className="text-xs text-neutral-500 ml-2 self-center">
                  No columns selected
                </span>
              )}
            </div>
          </div>

          {/* Label Input - Only show when columns are selected */}
          {hasColumns && (
            <div className="flex gap-2 items-center">
              <Label className="text-xs font-medium w-20">Label:</Label>
              <Input
                value={columnConfig?.label || selectedColumns.join(" + ")}
                onChange={(e) => updateColumnConfig({ label: e.target.value })}
                className="flex-1"
                placeholder="Column label"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
