"use client";

import { useMemo } from "react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { MapPin, XCircle } from "lucide-react";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";
import type { DataSource } from "@/server/models/DataSource";

const GROUP_LABEL_USER = "User data";
const GROUP_LABEL_PUBLIC = "Public data";

function isUserDataSource(ds: DataSource) {
  return !ds.public;
}

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
  const { inspectorUser, inspectorPublic, otherUser, otherPublic } = useMemo(
    () => ({
      inspectorUser: inspectorOrdered.filter(({ dataSource: ds }) =>
        isUserDataSource(ds),
      ),
      inspectorPublic: inspectorOrdered.filter(({ dataSource: ds }) => ds.public),
      otherUser: otherSources.filter(isUserDataSource),
      otherPublic: otherSources.filter((ds) => ds.public),
    }),
    [inspectorOrdered, otherSources],
  );

  const renderInspectorItem = ({
    config,
    dataSource: ds,
  }: {
    config: InspectorBoundaryConfig;
    dataSource: DataSource;
  }) => {
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
  };

  const renderOtherItem = (ds: DataSource) => {
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
  };

  const hasInspector = inspectorUser.length > 0 || inspectorPublic.length > 0;
  const hasOther = otherUser.length > 0 || otherPublic.length > 0;

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
        {hasInspector && (
          <section className="pb-2 border-b border-neutral-200">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
              Showing inspector
            </h3>
            <div className="space-y-3">
              {inspectorUser.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground px-2 mb-1">
                    {GROUP_LABEL_USER}
                  </p>
                  <div className="space-y-0.5">
                    {inspectorUser.map((item) => renderInspectorItem(item))}
                  </div>
                </div>
              )}
              {inspectorPublic.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground px-2 mb-1">
                    {GROUP_LABEL_PUBLIC}
                  </p>
                  <div className="space-y-0.5">
                    {inspectorPublic.map((item) => renderInspectorItem(item))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {hasOther && (
          <div className={cn("pt-2", hasInspector && "mt-2")}>
            {otherUser.length > 0 && (
              <section className="mb-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
                  {GROUP_LABEL_USER}
                </h3>
                <div className="space-y-0.5">
                  {otherUser.map(renderOtherItem)}
                </div>
              </section>
            )}
            {otherPublic.length > 0 && (
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
                  {GROUP_LABEL_PUBLIC}
                </h3>
                <div className="space-y-0.5">
                  {otherPublic.map(renderOtherItem)}
                </div>
              </section>
            )}
          </div>
        )}
        {!hasInspector && !hasOther && (
          <p className="text-sm text-muted-foreground p-2">
            No data sources match.
          </p>
        )}
      </div>
    </div>
  );
}
