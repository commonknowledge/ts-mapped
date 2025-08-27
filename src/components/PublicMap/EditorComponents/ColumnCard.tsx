import { useContext } from "react";
import { PublicMapColumnType } from "@/__generated__/types";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

interface ColumnCardProps {
  dataSourceId: string;
  badge: string;
  title: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
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
    }[]
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
  const { getDataSourceById } = useContext(DataSourcesContext);

  const dataSource = getDataSourceById(dataSourceId);
  const selectedColumn = value;
  const columnConfig = additionalColumns.find((ac) =>
    ac.sourceColumns.includes(selectedColumn || "")
  );

  const handleColumnSelect = (selectedColumn: string) => {
    const newValue = selectedColumn === "__none" ? "" : selectedColumn;
    onValueChange(newValue);
  };

  const updateColumnConfig = (
    updates: Partial<{
      label: string;
      type: PublicMapColumnType;
    }>
  ) => {
    if (!selectedColumn) return;

    const columnIndex = additionalColumns.findIndex((ac) =>
      ac.sourceColumns.includes(selectedColumn)
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
          label: updates.label || selectedColumn,
          sourceColumns: [selectedColumn],
          type: updates.type || PublicMapColumnType.String,
        },
      ];
      onAdditionalColumnsChange(newColumns);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-md overflow-hidden">
      {/* Column Header with Select */}
      <div className="flex items-center justify-between p-2 pr-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            {badge}
          </span>
          <span className="font-medium text-sm whitespace-nowrap">{title}</span>
        </div>
        <Select value={value || "__none"} onValueChange={handleColumnSelect}>
          <SelectTrigger className="shadow-none border-none text-right">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None</SelectItem>
            {dataSource?.columnDefs.map((cd) => (
              <SelectItem key={cd.name} value={cd.name}>
                {cd.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Column Settings - Always expanded if column is selected */}
      {selectedColumn && (
        <div className="border-t border-neutral-200 p-3 bg-neutral-50">
          <div className="flex flex-col gap-3">
            {/* Label Input */}
            <div className="flex gap-2 items-center">
              <Label className="text-xs font-medium w-20">Label:</Label>
              <Input
                value={columnConfig?.label || selectedColumn}
                onChange={(e) => updateColumnConfig({ label: e.target.value })}
                className="flex-1"
                placeholder="Column label"
              />
            </div>

            {/* Display Type Select - Disabled and set to Text */}
            <div className="flex gap-2 items-center">
              <Label className="text-xs font-medium w-20">Show as:</Label>
              <Select value={PublicMapColumnType.String} disabled>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PublicMapColumnType.String}>
                    Text
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
