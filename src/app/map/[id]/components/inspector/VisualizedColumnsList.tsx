"use client";

import { ChevronDown, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import ContextMenuContentWithFocus from "@/components/ContextMenuContentWithFocus";
import { ColumnType } from "@/server/models/DataSource";
import { CalculationType } from "@/server/models/MapView";
import { AreaSetCode } from "@/server/models/AreaSet";
import { cn } from "@/shadcn/utils";
import { formatNumber } from "@/utils/text";
import { useTRPC } from "@/services/trpc/react";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import InspectorColumnGroup from "./InspectorColumnGroup";
import SavedVisualizationItem from "../controls/NonPointDataSourcesControl/SavedVisualizationItem";
import type { ColumnDef } from "@/server/models/DataSource";
import type { CombinedAreaStats } from "@/app/map/[id]/data";
import type { MapConfig } from "@/server/models/Map";

interface VisualizedColumnsListProps {
  columns: ColumnDef[];
  dataSourceId: string;
  dataSourceName: string;
  areaStats: CombinedAreaStats | null | undefined;
  selectedBoundaryAreaCode: string | null;
  selectedBoundaryAreaSetCode: string | null;
  visualizedColumnName: string | null;
  onVisualise: (columnName: string) => void;
  onVisualiseSaved?: (visualization: NonNullable<MapConfig["savedVisualizations"]>[0]) => void;
}

export default function VisualizedColumnsList({
  columns,
  dataSourceId,
  dataSourceName,
  areaStats,
  selectedBoundaryAreaCode,
  selectedBoundaryAreaSetCode,
  visualizedColumnName,
  onVisualise,
  onVisualiseSaved,
}: VisualizedColumnsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trpc = useTRPC();
  const { mapConfig } = useMapConfig();

  // Fetch the data record for the selected boundary area
  const { data: dataRecord } = useQuery(
    trpc.dataRecord.byAreaCode.queryOptions(
      {
        dataSourceId,
        areaSetCode: (selectedBoundaryAreaSetCode as AreaSetCode) || AreaSetCode.WMC24,
        areaCode: selectedBoundaryAreaCode || "",
      },
      {
        enabled: Boolean(dataSourceId && selectedBoundaryAreaCode && selectedBoundaryAreaSetCode),
      },
    ),
  );

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
    // Get value from the data record's JSON
    if (!dataRecord?.json || !(column.name in dataRecord.json)) {
      return null;
    }

    const rawValue = dataRecord.json[column.name];
    
    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    // Format the value based on column type
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
    // Show as percentage if value is between 0 and 1
    return value >= 0 && value <= 1;
  };

  // Get column groups for this data source
  const getColumnGroups = (dataSourceId: string) => {
    const groupsConfig = mapConfig.columnGroups?.[dataSourceId];
    if (!groupsConfig) return { groups: [], ungroupedColumns: [] };
    return groupsConfig;
  };

  // Organize columns by groups
  const organizedColumns = useMemo(() => {
    const { groups, ungroupedColumns = [] } = getColumnGroups(dataSourceId);
    const allGroupedColumns = new Set(groups.flatMap(g => g.columnNames));
    
    // Find ungrouped columns (columns not in any group)
    const ungrouped = columns.filter(col => 
      !allGroupedColumns.has(col.name) && 
      (!ungroupedColumns.length || ungroupedColumns.includes(col.name))
    ).map(col => col.name);

    // Map groups to their actual column definitions
    const groupsWithColumns = groups.map(group => ({
      ...group,
      columns: columns.filter(col => group.columnNames.includes(col.name)),
    }));

    return {
      groups: groupsWithColumns,
      ungroupedColumns: columns.filter(col => ungrouped.includes(col.name)),
    };
  }, [dataSourceId, columns, mapConfig.columnGroups]);

  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left hover:bg-neutral-50 rounded px-2 py-1.5 transition-colors group"
      >
        <h3 className="text-muted-foreground text-xs uppercase font-mono">
          {dataSourceName}
        </h3>
        <ChevronDown
          size={14}
          className={cn(
            "text-neutral-400 transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )}
        />
      </button>
      {isExpanded && (
        <dl className="flex flex-col gap-2 ml-2">
          {(() => {
            const savedVisualizations = (mapConfig.savedVisualizations || []).filter(
              v => v.areaDataSourceId === dataSourceId
            );
            const isVisualizationActive = (visualization: NonNullable<MapConfig["savedVisualizations"]>[0]) => {
              // Check if this saved visualization matches current viewConfig
              // This is a simplified check - in a real scenario you'd compare all fields
              return visualizedColumnName === visualization.areaDataColumn;
            };
            const handleVisualiseSaved = (visualization: NonNullable<MapConfig["savedVisualizations"]>[0]) => {
              if (onVisualiseSaved) {
                onVisualiseSaved(visualization);
              } else {
                // Fallback to simple column visualization
                onVisualise(visualization.areaDataColumn);
              }
            };
            const handleDeleteSaved = () => {
              // Delete functionality can be added if needed in inspector
            };

            return (
              <>
                {savedVisualizations.length > 0 && (
                  <div className="space-y-2 mb-2 pb-2 border-b border-neutral-200">
                    {savedVisualizations.map((visualization) => (
                      <SavedVisualizationItem
                        key={visualization.id}
                        visualization={visualization}
                        isActive={isVisualizationActive(visualization)}
                        onVisualise={handleVisualiseSaved}
                        onDelete={handleDeleteSaved}
                      />
                    ))}
                  </div>
                )}
                {organizedColumns.groups.map((group) => (
                  <InspectorColumnGroup
                    key={group.id}
                    groupName={group.name}
                    columns={group.columns}
                    dataRecord={dataRecord}
                    visualizedColumnName={visualizedColumnName}
                    onVisualise={onVisualise}
                  />
                ))}
              </>
            );
          })()}
          
          {organizedColumns.ungroupedColumns.length > 0 && (
            <div className="space-y-2">
              {organizedColumns.ungroupedColumns.map((column) => {
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
        </dl>
      )}
    </div>
  );
}
