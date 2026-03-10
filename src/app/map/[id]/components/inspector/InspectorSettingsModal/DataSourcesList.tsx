"use client";

import { Library, MapPin, XCircle } from "lucide-react";
import { useMemo } from "react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { getDataSourceType } from "@/components/DataSourceItem";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import type { DataSource } from "@/server/models/DataSource";
import type { InspectorBoundaryConfig } from "@/server/models/MapView";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InspectorEntry {
  config: InspectorBoundaryConfig;
  dataSource: DataSource;
}

interface DataSourcesListProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  inspectorOrdered: InspectorEntry[];
  otherSources: DataSource[];
  onMapId: string | null;
  selectedDataSourceId: string | null;
  onSelectDataSource: (id: string) => void;
  onRemoveFromInspector: (configId: string) => void;
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function OnMapBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 shrink-0"
      title="Used for map colour"
    >
      <MapPin className="w-2.5 h-2.5" />
      On map
    </span>
  );
}

function DsIcon({ ds }: { ds: DataSource }) {
  return (
    <span className="shrink-0">
      <DataSourceIcon
        type={getDataSourceType(
          ds as Parameters<typeof getDataSourceType>[0],
        )}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Item renderers
// ---------------------------------------------------------------------------

function InspectorItem({
  entry,
  isOnMap,
  isSelected,
  onSelect,
  onRemove,
}: {
  entry: InspectorEntry;
  isOnMap: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { dataSource: ds } = entry;
  return (
    <div
      className={cn(
        "rounded-lg border transition-colors flex items-center gap-2",
        isSelected ? "bg-primary/10 border-primary/30" : "border-transparent",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 text-left rounded-lg p-2.5 flex items-center gap-2 hover:bg-neutral-50"
      >
        <DsIcon ds={ds} />
        <span className="flex-1 min-w-0 truncate text-sm font-medium">
          {ds.name}
        </span>
        {isOnMap && <OnMapBadge />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 p-1.5 rounded text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
        title="Remove from inspector"
        aria-label="Remove from inspector"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

function LibraryItem({
  ds,
  isOnMap,
  isSelected,
  onSelect,
}: {
  ds: DataSource;
  isOnMap: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-lg p-2.5 flex items-center gap-2 border transition-colors",
        isSelected
          ? "bg-primary/10 border-primary/30"
          : "hover:bg-neutral-50 border-transparent",
      )}
    >
      <DsIcon ds={ds} />
      <span className="flex-1 min-w-0 truncate text-sm font-medium">
        {ds.name}
      </span>
      <div className="flex shrink-0 gap-1 items-center">
        {isSelected && (
          <Library
            className="w-3.5 h-3.5 text-muted-foreground"
            title="From library"
          />
        )}
        {isOnMap && <OnMapBadge />}
      </div>
    </button>
  );
}

function LibraryGroup({
  label,
  items,
  onMapId,
  selectedDataSourceId,
  onSelectDataSource,
  className,
}: {
  label: string;
  items: DataSource[];
  onMapId: string | null;
  selectedDataSourceId: string | null;
  onSelectDataSource: (id: string) => void;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <p className="text-[11px] font-medium text-muted-foreground px-2 mb-1">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((ds) => (
          <LibraryItem
            key={ds.id}
            ds={ds}
            isOnMap={ds.id === onMapId}
            isSelected={ds.id === selectedDataSourceId}
            onSelect={() => onSelectDataSource(ds.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DataSourcesList({
  searchQuery,
  onSearchChange,
  inspectorOrdered,
  otherSources,
  onMapId,
  selectedDataSourceId,
  onSelectDataSource,
  onRemoveFromInspector,
}: DataSourcesListProps) {
  const { otherUser, otherPublic } = useMemo(
    () => ({
      otherUser: otherSources.filter((ds) => !ds.public),
      otherPublic: otherSources.filter((ds) => ds.public),
    }),
    [otherSources],
  );

  const hasInspector = inspectorOrdered.length > 0;
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
        {/* On this map */}
        {hasInspector && (
          <section className="pb-2 border-b border-neutral-200">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
              On this map
            </h3>
            <div className="space-y-0.5">
              {inspectorOrdered.map((entry) => (
                <InspectorItem
                  key={entry.dataSource.id}
                  entry={entry}
                  isOnMap={entry.dataSource.id === onMapId}
                  isSelected={entry.dataSource.id === selectedDataSourceId}
                  onSelect={() => onSelectDataSource(entry.dataSource.id)}
                  onRemove={() => onRemoveFromInspector(entry.config.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Library */}
        {hasOther && (
          <section className={cn("pt-2", hasInspector && "mt-2")}>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5 flex items-center gap-1.5">
              <Library className="w-3.5 h-3.5" />
              Library
            </h3>
            <LibraryGroup
              label="User data"
              items={otherUser}
              onMapId={onMapId}
              selectedDataSourceId={selectedDataSourceId}
              onSelectDataSource={onSelectDataSource}
              className="mt-1"
            />
            <LibraryGroup
              label="Public data"
              items={otherPublic}
              onMapId={onMapId}
              selectedDataSourceId={selectedDataSourceId}
              onSelectDataSource={onSelectDataSource}
              className={cn(otherUser.length > 0 && "mt-3")}
            />
          </section>
        )}

        {/* Empty state */}
        {!hasInspector && !hasOther && (
          <p className="text-sm text-muted-foreground p-2">
            No data sources match.
          </p>
        )}
      </div>
    </div>
  );
}
