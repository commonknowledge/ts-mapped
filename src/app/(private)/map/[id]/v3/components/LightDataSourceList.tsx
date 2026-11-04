"use client";

import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import DataSourceIcon from "@/components/DataSourceIcon";
import { Link } from "@/components/Link";
import { useDataSources } from "@/hooks/useDataSources";
import { cn } from "@/shadcn/utils";
import type { RouterOutputs } from "@/services/trpc/react";
import type { ReactNode } from "react";

export type ListedDataSource =
  RouterOutputs["dataSource"]["listReadable"][number];

// Same grouping as the classic data source picker
const GROUPS: {
  label: string;
  matches: (ds: ListedDataSource) => boolean;
}[] = [
  { label: "Your data", matches: (ds) => !ds.public },
  {
    label: "Movement data library",
    matches: (ds) => ds.public && Boolean(ds.adminApproved),
  },
  {
    label: "Other public data",
    matches: (ds) => ds.public && !ds.adminApproved,
  },
];

// A searchable, grouped list of data sources, used by the light editor's
// Add markers and Data visualisation panels
export default function LightDataSourceList({
  onSelect,
  isSelected,
  renderMarker,
  focusedId,
}: {
  onSelect: (dataSource: ListedDataSource) => void;
  isSelected?: (dataSource: ListedDataSource) => boolean;
  /** Optional leading marker, e.g. the ring of a layer already on the map */
  renderMarker?: (dataSource: ListedDataSource) => ReactNode;
  /** The only choice for now (e.g. in the guided tour): listed first, with
   *  every other source greyed out */
  focusedId?: string | null;
}) {
  const { data: dataSources, isPending } = useDataSources();
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = (dataSources ?? []).filter(
      (ds) =>
        !query ||
        ds.name.toLowerCase().includes(query) ||
        ds.columnDefs.some((col) => col.name.toLowerCase().includes(query)),
    );
    const byName = (a: ListedDataSource, b: ListedDataSource) =>
      a.name.localeCompare(b.name);
    const focused = matching.find((ds) => ds.id === focusedId);
    return [
      ...(focused ? [{ label: "Use this one", items: [focused] }] : []),
      ...GROUPS.map((group) => ({
        label: group.label,
        items: matching
          .filter((ds) => group.matches(ds) && ds.id !== focusedId)
          .sort(byName),
      })),
    ].filter((group) => group.items.length > 0);
  }, [dataSources, focusedId, search]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <label className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 focus-within:border-neutral-400">
        <SearchIcon className="size-3.5 shrink-0 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search data sources or columns"
          aria-label="Search data sources"
          className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none"
        />
      </label>

      {isPending ? (
        <p className="text-xs text-neutral-500">Loading data sources…</p>
      ) : groups.length === 0 ? (
        <p className="text-xs text-neutral-500">
          {search ? "No data sources match." : "No data sources yet."}
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.label}>
            <p className="mb-1 font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
              {group.label}
            </p>
            <ul className="-mx-1.5 flex flex-col">
              {group.items.map((ds) => {
                const selected = isSelected?.(ds) ?? false;
                const isFocused = ds.id === focusedId;
                const isDisabled = Boolean(focusedId) && !isFocused;
                return (
                  <li key={ds.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(ds)}
                      disabled={isDisabled}
                      data-tour-focused={isFocused || undefined}
                      aria-pressed={isSelected ? selected : undefined}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent",
                        selected && "bg-white shadow-[inset_0_0_0_1px_#e5e5e5]",
                        isFocused &&
                          !selected &&
                          "bg-white shadow-[inset_0_0_0_1px_#15213b]",
                      )}
                    >
                      <span className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
                        {renderMarker?.(ds) ?? (
                          <DataSourceIcon type={ds.config.type} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">
                          {ds.name}
                        </span>
                        <span className="block truncate text-[11px] text-neutral-500">
                          {ds.recordCount?.toLocaleString("en-GB") ?? 0} records
                          · {ds.columnDefs.length} columns
                        </span>
                      </span>
                      {selected && (
                        <CheckIcon className="size-3.5 shrink-0 text-neutral-900" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <Link
        href="/data-sources/new"
        className="-ml-1 flex items-center gap-1 rounded px-1 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <PlusIcon className="size-3.5" />
        Connect a new data source
      </Link>
    </div>
  );
}
