"use client";

import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import TogglePanel from "@/app/map/[id]/components/TogglePanel";
import { cn } from "@/shadcn/utils";
import type { DataSourceWithImportInfo } from "@/components/DataSourceItem";

export function InspectorPreview({
  boundaryConfigs,
  onMapDataSourceName,
  getDataSourceById,
  className,
}: {
  boundaryConfigs: InspectorBoundaryConfig[];
  onMapDataSourceName: string | null;
  getDataSourceById: (id: string) => DataSourceWithImportInfo | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 text-sm", className)}>
      {onMapDataSourceName && (
        <section className="rounded border border-neutral-200 bg-neutral-50/80 p-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
            On the map
          </p>
          <p className="text-xs text-muted-foreground">{onMapDataSourceName}</p>
        </section>
      )}
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Data in this area
      </p>
      {boundaryConfigs.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No data sources added</p>
      ) : (
        boundaryConfigs.map((config) => {
          const ds = getDataSourceById(config.dataSourceId);
          const type = ds ? getDataSourceType(ds) : null;
          return (
            <TogglePanel
              key={config.id}
              label={config.name}
              icon={type ? <span className="shrink-0"><DataSourceIcon type={type} /></span> : undefined}
              defaultExpanded={true}
            >
              <div className="pl-1 pt-1">
                {config.columns.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No columns selected</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {config.columns.join(", ")}
                  </p>
                )}
              </div>
            </TogglePanel>
          );
        })
      )}
    </div>
  );
}
