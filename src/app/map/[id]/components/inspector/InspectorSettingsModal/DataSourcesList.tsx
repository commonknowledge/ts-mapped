"use client";

import { Library, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { MarkerCollectionIcon } from "@/app/map/[id]/components/Icons";
import { DataSourceInspectorIcon } from "@/app/map/[id]/components/inspector/inspectorPanelOptions";
import { mapColors } from "@/app/map/[id]/styles";
import { DataSourceTypeLabels } from "@/labels";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import type { DataSource } from "@/server/models/DataSource";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DataSourcesListProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  markerSources: DataSource[];
  visualisationSources: DataSource[];
  librarySources: DataSource[];
  selectedDataSourceId: string | null;
  onSelectDataSource: (id: string) => void;
  onRemoveFromMap: (dataSourceId: string) => void;
  /** For map sources that are marker/member layers: show MarkerCollectionIcon with this color. Key = dataSourceId. */
  markerLayerColors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function DsIcon({
  ds,
  markerColor,
}: {
  ds: DataSource;
  markerColor?: string | null;
}) {
  if (markerColor) {
    return (
      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-muted-foreground">
        <MarkerCollectionIcon color={markerColor} />
      </span>
    );
  }
  return (
    <DataSourceInspectorIcon
      dataSource={ds}
      className="w-4 h-4 shrink-0 text-muted-foreground"
    />
  );
}

function dsSubtitle(ds: DataSource) {
  return [
    DataSourceTypeLabels[ds.config.type],
    ds.recordCount != null ? String(ds.recordCount) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// ---------------------------------------------------------------------------
// Item renderers
// ---------------------------------------------------------------------------

function MapSourceItem({
  ds,
  isSelected,
  onSelect,
  onRemoveFromMap,
  markerColor,
}: {
  ds: DataSource;
  isSelected: boolean;
  onSelect: () => void;
  onRemoveFromMap: (dataSourceId: string) => void;
  markerColor?: string | null;
}) {
  return (
    <div
      className={cn(
        "rounded-md border transition-colors flex items-center gap-0",
        isSelected
          ? "bg-primary/10 border-primary/30"
          : "border-neutral-200 bg-white hover:bg-neutral-50",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 text-left px-3 py-2.5 flex items-center gap-2"
      >
        <DsIcon ds={ds} markerColor={markerColor} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{ds.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {dsSubtitle(ds)}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemoveFromMap(ds.id);
        }}
        className="shrink-0 p-1.5 mr-1 rounded text-muted-foreground hover:bg-neutral-100 hover:text-destructive"
        title="Remove from map"
        aria-label="Remove from map"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

function LibraryItem({
  ds,
  isSelected,
  onSelect,
}: {
  ds: DataSource;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-md px-3 py-1.5 flex items-center gap-2 transition-colors",
        isSelected ? "bg-primary/10" : "hover:bg-neutral-50",
      )}
    >
      <DsIcon ds={ds} />
      <span className="flex-1 min-w-0 truncate text-sm">{ds.name}</span>
    </button>
  );
}

function LibraryTabs({
  libraryUser,
  libraryMovement,
  selectedDataSourceId,
  onSelectDataSource,
}: {
  libraryUser: DataSource[];
  libraryMovement: DataSource[];
  selectedDataSourceId: string | null;
  onSelectDataSource: (id: string) => void;
}) {
  const defaultTab = libraryUser.length > 0 ? "user" : "movement";
  const [tab, setTab] = useState<"user" | "movement">(defaultTab);
  const items = tab === "user" ? libraryUser : libraryMovement;

  return (
    <div className="mt-1">
      <div className="flex gap-1 px-1 mb-1.5">
        {libraryUser.length > 0 && (
          <button
            type="button"
            onClick={() => setTab("user")}
            className={cn(
              "px-2 py-1 rounded text-[11px] font-medium transition-colors",
              tab === "user"
                ? "bg-neutral-200 text-foreground"
                : "text-muted-foreground hover:bg-neutral-100",
            )}
          >
            User data
          </button>
        )}
        {libraryMovement.length > 0 && (
          <button
            type="button"
            onClick={() => setTab("movement")}
            className={cn(
              "px-2 py-1 rounded text-[11px] font-medium transition-colors",
              tab === "movement"
                ? "bg-neutral-200 text-foreground"
                : "text-muted-foreground hover:bg-neutral-100",
            )}
          >
            Movement data
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {items.map((ds) => (
          <LibraryItem
            key={ds.id}
            ds={ds}
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
  markerSources,
  visualisationSources,
  librarySources,
  selectedDataSourceId,
  onSelectDataSource,
  onRemoveFromMap,
  markerLayerColors,
}: DataSourcesListProps) {
  const { libraryUser, libraryMovement } = useMemo(
    () => ({
      libraryUser: librarySources.filter((ds) => !ds.public),
      libraryMovement: librarySources.filter((ds) => ds.public),
    }),
    [librarySources],
  );

  const hasMarkers = markerSources.length > 0;
  const hasVisualisation = visualisationSources.length > 0;
  const hasLibrary = libraryUser.length > 0 || libraryMovement.length > 0;

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
        {/* Markers */}
        <section className="pb-2">
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
            Markers
          </h3>
          {hasMarkers ? (
            <div className="space-y-1.5">
              {markerSources.map((ds) => (
                <MapSourceItem
                  key={ds.id}
                  ds={ds}
                  isSelected={ds.id === selectedDataSourceId}
                  onSelect={() => onSelectDataSource(ds.id)}
                  onRemoveFromMap={onRemoveFromMap}
                  markerColor={markerLayerColors[ds.id]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-1">
              No marker layers added yet.
            </p>
          )}
        </section>

        {/* Visualisation data */}
        <section className="pt-2 border-t border-neutral-200 mb-6">
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5">
            Visualisation data
          </h3>
          {hasVisualisation ? (
            <div className="space-y-1.5">
              {visualisationSources.map((ds) => (
                <MapSourceItem
                  key={ds.id}
                  ds={ds}
                  isSelected={ds.id === selectedDataSourceId}
                  onSelect={() => onSelectDataSource(ds.id)}
                  onRemoveFromMap={onRemoveFromMap}
                  markerColor={markerLayerColors[ds.id]}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-1">
              No visualisation data added yet.
            </p>
          )}
        </section>

        {/* Library */}
        {hasLibrary && (
          <section className="pt-2 border-t border-neutral-200">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-2 py-1.5 flex items-center gap-1.5">
              <Library className="w-3.5 h-3.5" />
              Add data from Library
            </h3>
            <LibraryTabs
              libraryUser={libraryUser}
              libraryMovement={libraryMovement}
              selectedDataSourceId={selectedDataSourceId}
              onSelectDataSource={onSelectDataSource}
            />
          </section>
        )}

        {/* Empty state */}
        {!hasMarkers && !hasVisualisation && !hasLibrary && (
          <p className="text-sm text-muted-foreground p-2">
            No data sources match.
          </p>
        )}
      </div>
    </div>
  );
}
