"use client";

import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { MapPin, XCircle } from "lucide-react";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import type { DataSource } from "@/server/models/DataSource";

export function DataSourcesList({
  searchQuery,
  onSearchChange,
  inspectorOrdered,
  otherSources,
  onMapId,
  selectedDataSourceId,
  onSelectDataSource,
  onRemoveFromInspector,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  inspectorOrdered: Array<{
    config: InspectorBoundaryConfig;
    dataSource: DataSource;
  }>;
  otherSources: DataSource[];
  onMapId: string | null;
  selectedDataSourceId: string | null;
  onSelectDataSource: (id: string) => void;
  onRemoveFromInspector: (configId: string) => void;
}) {
  return (
    <div className="w-72 shrink-0 border-r flex flex-col">
      <div className="p-2 border-b">
        <Input
          placeholder="Search data sources..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {inspectorOrdered.length > 0 && (
          <section className="pb-2 border-b border-neutral-200">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
              Showing inspector
            </h3>
            <div className="space-y-0.5">
              {inspectorOrdered.map(({ config, dataSource: ds }) => {
                const isOnMap = ds.id === onMapId;
                const isSelected = ds.id === selectedDataSourceId;
                return (
                  <div
                    key={ds.id}
                    className={cn(
                      "rounded-lg border transition-colors flex items-center gap-2",
                      isSelected
                        ? "bg-primary/10 border-primary/30"
                        : "border-transparent",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDataSource(ds.id)}
                      className="flex-1 min-w-0 text-left rounded-lg p-2.5 flex items-center gap-2 hover:bg-neutral-50"
                    >
                      <span className="shrink-0">
                        <DataSourceIcon
                          type={getDataSourceType(
                            ds as Parameters<typeof getDataSourceType>[0],
                          )}
                        />
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm font-medium">
                        {ds.name}
                      </span>
                      {isOnMap && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 shrink-0"
                          title="Used for map colour"
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          On map
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromInspector(config.id);
                      }}
                      className="shrink-0 p-1.5 rounded text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
                      title="Remove from inspector"
                      aria-label="Remove from inspector"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {otherSources.length > 0 && (
          <div
            className={cn("pt-2", inspectorOrdered.length > 0 && "mt-2")}
          >
            {otherSources.map((ds) => {
              const isOnMap = ds.id === onMapId;
              const isSelected = ds.id === selectedDataSourceId;
              return (
                <button
                  type="button"
                  key={ds.id}
                  onClick={() => onSelectDataSource(ds.id)}
                  className={cn(
                    "w-full text-left rounded-lg p-2.5 flex items-center gap-2 border transition-colors",
                    isSelected
                      ? "bg-primary/10 border-primary/30"
                      : "hover:bg-neutral-50 border-transparent",
                  )}
                >
                  <span className="shrink-0">
                    <DataSourceIcon
                      type={getDataSourceType(
                        ds as Parameters<typeof getDataSourceType>[0],
                      )}
                    />
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm font-medium">
                    {ds.name}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    {isOnMap && (
                      <span
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800"
                        title="Used for map colour"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        On map
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {inspectorOrdered.length === 0 && otherSources.length === 0 && (
          <p className="text-sm text-muted-foreground p-2">
            No data sources match.
          </p>
        )}
      </div>
    </div>
  );
}
