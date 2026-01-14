"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDataSources } from "@/app/map/[id]/hooks/useDataSources";
import { useMapConfig } from "@/app/map/[id]/hooks/useMapConfig";
import { useMapViews } from "@/app/map/[id]/hooks/useMapViews";
import { useTable } from "@/app/map/[id]/hooks/useTable";
import { LayerType } from "@/types";
import { cn } from "@/shadcn/utils";
import { CalculationType } from "@/server/models/MapView";
import DataSourceItem from "../DataSourceItem";
import EmptyLayer from "../LayerEmptyMessage";
import DataSourceColumnItem from "./DataSourceColumnItem";
import { useChoropleth } from "@/app/map/[id]/hooks/useChoropleth";

export default function NonPointDataSourcesList() {
  const { mapConfig } = useMapConfig();
  const { data: dataSources } = useDataSources();
  const { selectedDataSourceId, handleDataSourceSelect } = useTable();
  const { updateViewConfig, viewConfig } = useMapViews();
  const { setBoundariesPanelOpen } = useChoropleth();
  const [expandedDataSources, setExpandedDataSources] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand datasource that contains the visualized column
  useEffect(() => {
    if (viewConfig.areaDataSourceId && viewConfig.areaDataColumn) {
      setExpandedDataSources((prev) => {
        const next = new Set(prev);
        next.add(viewConfig.areaDataSourceId);
        return next;
      });
    }
  }, [viewConfig.areaDataSourceId, viewConfig.areaDataColumn]);

  const nonPointDataSources = useMemo(() => {
    const selectedIds = mapConfig.nonPointDataSourceIds || [];
    return dataSources?.filter((ds) => selectedIds.includes(ds.id)) || [];
  }, [dataSources, mapConfig.nonPointDataSourceIds]);

  const toggleDataSource = (dataSourceId: string) => {
    setExpandedDataSources((prev) => {
      const next = new Set(prev);
      if (next.has(dataSourceId)) {
        next.delete(dataSourceId);
      } else {
        next.add(dataSourceId);
      }
      return next;
    });
  };

  const handleVisualise = (dataSourceId: string, columnName: string) => {
    // For data layers, use data values (Sum of column values, not count)
    updateViewConfig({
      areaDataSourceId: dataSourceId,
      areaDataColumn: columnName,
      calculationType: CalculationType.Sum, // Use data values from the column
    });
    // Open the boundaries panel to show the visualization
    setBoundariesPanelOpen(true);
  };

  if (nonPointDataSources.length === 0) {
    return <EmptyLayer message="Add a data source" />;
  }

  return (
    <ul className="flex flex-col gap-1 ml-1">
      {nonPointDataSources.map((dataSource) => {
        const isExpanded = expandedDataSources.has(dataSource.id);
        const hasColumns = dataSource.columnDefs && dataSource.columnDefs.length > 0;

        return (
          <li key={dataSource.id}>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDataSource(dataSource.id);
                  }}
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded hover:bg-neutral-100 transition-colors shrink-0",
                    !hasColumns && "invisible"
                  )}
                  disabled={!hasColumns}
                  aria-label={isExpanded ? "Collapse columns" : "Expand columns"}
                >
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-neutral-400 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <DataSourceItem
                    dataSource={dataSource}
                    isSelected={selectedDataSourceId === dataSource.id}
                    handleDataSourceSelect={handleDataSourceSelect}
                    layerType={LayerType.DataLayer}
                  />
                </div>
              </div>
              {isExpanded && hasColumns && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {dataSource.columnDefs.map((column) => {
                    const isVisualized =
                      viewConfig.areaDataSourceId === dataSource.id &&
                      viewConfig.areaDataColumn === column.name;
                    return (
                      <DataSourceColumnItem
                        key={column.name}
                        column={column}
                        dataSourceId={dataSource.id}
                        dataSourceName={dataSource.name}
                        onVisualise={handleVisualise}
                        isVisualized={isVisualized}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
