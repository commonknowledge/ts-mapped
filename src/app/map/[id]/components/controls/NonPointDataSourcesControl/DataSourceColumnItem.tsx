"use client";

import { Check, ChevronRight, Palette } from "lucide-react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { ColumnType } from "@/server/models/DataSource";
import type { ColumnDef } from "@/server/models/DataSource";
import { cn } from "@/shadcn/utils";

interface DataSourceColumnItemProps {
  column: ColumnDef;
  dataSourceId: string;
  dataSourceName: string;
  onVisualise: (dataSourceId: string, columnName: string) => void;
  isVisualized?: boolean;
}

export default function DataSourceColumnItem({
  column,
  dataSourceId,
  dataSourceName,
  onVisualise,
  isVisualized = false,
}: DataSourceColumnItemProps) {
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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-colors",
            isVisualized
              ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
              : "hover:bg-neutral-50"
          )}
        >
          <ChevronRight
            size={12}
            className={cn(
              "flex-shrink-0",
              isVisualized ? "text-blue-600" : "text-neutral-400"
            )}
          />
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-xs font-medium truncate flex items-center gap-1",
                isVisualized && "text-blue-700"
              )}
            >
              {column.name}
              {isVisualized && (
                <Check size={12} className="text-blue-600 flex-shrink-0" />
              )}
            </div>
            <div
              className={cn(
                "text-xs truncate",
                isVisualized ? "text-blue-600" : "text-muted-foreground"
              )}
            >
              {getColumnTypeLabel(column.type)}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContentWithFocus>
        <ContextMenuItem
          onClick={() => onVisualise(dataSourceId, column.name)}
        >
          <Palette size={12} />
          Visualise on map
        </ContextMenuItem>
      </ContextMenuContentWithFocus>
    </ContextMenu>
  );
}
