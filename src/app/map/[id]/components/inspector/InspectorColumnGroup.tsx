"use client";

import { ChevronDown, Folder, Palette } from "lucide-react";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { cn } from "@/shadcn/utils";
import type { ColumnDef } from "@/server/models/DataSource";
import { ColumnType } from "@/server/models/DataSource";
import { formatNumber } from "@/utils/text";

interface InspectorColumnGroupProps {
  groupName: string;
  columns: ColumnDef[];
  dataRecord: { json: Record<string, unknown> } | null | undefined;
  visualizedColumnName: string | null;
  onVisualise: (columnName: string) => void;
}

export default function InspectorColumnGroup({
  groupName,
  columns,
  dataRecord,
  visualizedColumnName,
  onVisualise,
}: InspectorColumnGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getColumnTypeLabel = (type: ColumnType) => {
    switch (type) {
      case ColumnType.String:
        return "String";
      case ColumnType.Number:
        return "Number";
      case ColumnType.Date:
        return "Date";
      case ColumnType.Boolean:
        return "Boolean";
      default:
        return "Unknown";
    }
  };

  const getColumnValue = (column: ColumnDef) => {
    if (!dataRecord?.json || !(column.name in dataRecord.json)) {
      return null;
    }

    const rawValue = dataRecord.json[column.name];
    
    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    if (column.type === ColumnType.Number) {
      const numValue = Number(rawValue);
      if (isNaN(numValue)) {
        return String(rawValue);
      }
      return numValue;
    }

    if (column.type === ColumnType.Boolean) {
      return Boolean(rawValue);
    }

    return String(rawValue);
  };

  const shouldShowAsPercentage = (column: ColumnDef, value: number | string | boolean | null) => {
    if (column.type !== ColumnType.Number || typeof value !== "number" || isNaN(value)) {
      return false;
    }
    return value >= 0 && value <= 1;
  };

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-50 transition-colors text-left"
      >
        <ChevronDown
          size={12}
          className={cn(
            "text-neutral-400 transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )}
        />
        <Folder size={12} className="text-neutral-400 flex-shrink-0" />
        <span className="text-xs font-medium text-neutral-700 truncate">
          {groupName}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {columns.length}
        </span>
      </button>
      {isExpanded && (
        <div className="ml-4 mt-0.5 space-y-2">
          {columns.map((column) => {
            const isVisualized = column.name === visualizedColumnName;
            const rawValue = getColumnValue(column);
            const isPercentage = rawValue !== null && typeof rawValue === "number" && shouldShowAsPercentage(column, rawValue);
            const percentageValue = isPercentage ? rawValue * 100 : null;
            const displayValue = isPercentage 
              ? `${Math.round(percentageValue * 10) / 10}%`
              : rawValue !== null
              ? column.type === ColumnType.Number
                ? formatNumber(rawValue as number)
                : column.type === ColumnType.Boolean
                ? String(rawValue)
                : String(rawValue)
              : null;

            return (
              <ContextMenu key={column.name}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "flex flex-col gap-1 p-2 rounded cursor-pointer transition-colors",
                      isVisualized
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <dt
                        className={cn(
                          "text-xs uppercase font-mono flex items-center gap-1",
                          isVisualized
                            ? "text-blue-700"
                            : "text-muted-foreground"
                        )}
                      >
                        {column.name}
                        {isVisualized && (
                          <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
                            Visualised
                          </span>
                        )}
                      </dt>
                      <span
                        className={cn(
                          "text-[10px]",
                          isVisualized
                            ? "text-blue-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {getColumnTypeLabel(column.type)}
                      </span>
                    </div>
                    {displayValue !== null && (
                      <dd className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "font-medium text-sm",
                            isVisualized ? "text-blue-900" : "text-neutral-900"
                          )}
                        >
                          {displayValue}
                        </span>
                        {isPercentage && (
                          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                isVisualized ? "bg-blue-600" : "bg-neutral-400"
                              )}
                              style={{ width: `${percentageValue}%` }}
                            />
                          </div>
                        )}
                      </dd>
                    )}
                    {displayValue === null && (
                      <dd className="text-xs text-muted-foreground italic">
                        No data available
                      </dd>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContentWithFocus>
                  <ContextMenuItem onClick={() => onVisualise(column.name)}>
                    <Palette size={12} />
                    Visualise on map
                  </ContextMenuItem>
                </ContextMenuContentWithFocus>
              </ContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
