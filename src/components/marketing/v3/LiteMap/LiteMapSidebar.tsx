"use client";

import DataSourceIcon from "@/components/DataSourceIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import {
  BOUNDARIES,
  BOUNDARY_OPTIONS,
  COLLECTIONS,
  COLLECTION_IDS,
  LEGEND_PARTIES,
  PARTY_NAMES,
  VISUALISATIONS,
  type Visualisation,
} from "./constants";
import { MARKER_TOTALS } from "./data";
import MarkerSwatch from "./MarkerSwatch";
import { getMaxShare, getPartyColor, getShareStops } from "./utils";
import type { AreaResult, Boundary, CollectionId } from "./types";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1.5 font-mono text-[9px] tracking-widest text-neutral-400 uppercase">
    {children}
  </p>
);

export default function LiteMapSidebar({
  boundary,
  onBoundaryChange,
  visualisation,
  onVisualisationChange,
  visibleCollections,
  onCollectionVisibilityChange,
  results,
}: {
  boundary: Boundary;
  onBoundaryChange: (boundary: Boundary) => void;
  visualisation: Visualisation;
  onVisualisationChange: (visualisation: Visualisation) => void;
  visibleCollections: Record<CollectionId, boolean>;
  onCollectionVisibilityChange: (id: CollectionId, visible: boolean) => void;
  results: AreaResult[];
}) {
  return (
    // Matches the toolbar's left column so the views line up with the map
    <aside className="flex w-[18.4%] min-w-[156px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-neutral-200 p-3">
      <p className="text-xs font-medium">Layers</p>

      <section className="-mx-1.5 rounded-md px-1.5 py-1 outline-2 outline-offset-2 outline-transparent transition-[outline-color] group-data-[active=markers]/demo:bg-[#91e17e]/20 group-data-[active=markers]/demo:outline-[#15213b]">
        <SectionLabel>Markers</SectionLabel>
        <ul data-hotspot-anchor="markers" className="grid grid-cols-1 gap-2">
          {COLLECTION_IDS.map((id) => {
            const collection = COLLECTIONS[id];
            const visible = visibleCollections[id];
            return (
              <li key={id}>
                {/* The marker icon doubles as the visibility toggle */}
                <button
                  type="button"
                  aria-pressed={visible}
                  aria-label={`${visible ? "Hide" : "Show"} ${collection.name}`}
                  title={visible ? "Hide on map" : "Show on map"}
                  onClick={() => onCollectionVisibilityChange(id, !visible)}
                  className="group/marker -mx-1 flex w-[calc(100%+0.5rem)] cursor-pointer items-start gap-2 rounded px-1 py-0.5 text-left hover:bg-neutral-100"
                >
                  <span
                    className={cn(
                      "mt-px rounded-full transition-[opacity,filter] group-hover/marker:scale-110",
                      !visible && "opacity-30 grayscale",
                    )}
                  >
                    <MarkerSwatch id={id} />
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 transition-opacity",
                      !visible && "opacity-50",
                    )}
                  >
                    <span className="block font-medium">{collection.name}</span>
                    <span className="flex min-w-0 items-center gap-1 text-neutral-500">
                      <span className="flex size-3 shrink-0 items-center justify-center [&_svg]:size-3">
                        <DataSourceIcon type={collection.source} />
                      </span>
                      <span className="min-w-0 truncate">
                        {collection.detail}
                      </span>
                    </span>
                    <span className="text-neutral-500">
                      {MARKER_TOTALS[id]} records
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="-mx-1.5 rounded-md px-1.5 py-1 outline-2 outline-offset-2 outline-transparent transition-[outline-color] group-data-[active=boundaries]/demo:bg-[#91e17e]/20 group-data-[active=boundaries]/demo:outline-[#15213b]">
        <SectionLabel>Boundaries</SectionLabel>
        <div
          data-hotspot-anchor="boundaries"
          role="radiogroup"
          aria-label="Boundaries"
          className="grid grid-cols-2 gap-0.5 rounded-md bg-neutral-100 p-0.5"
        >
          {BOUNDARY_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={boundary === value}
              onClick={() => onBoundaryChange(value)}
              className={cn(
                "cursor-pointer truncate rounded px-1 py-1 text-[10px]",
                boundary === value
                  ? "bg-white font-medium shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              {BOUNDARIES[value].label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-neutral-500">
          {BOUNDARIES[boundary].description}
        </p>
      </section>

      <section className="-mx-1.5 rounded-md px-1.5 py-1 outline-2 outline-offset-2 outline-transparent transition-[outline-color] group-data-[active=data-visualisation]/demo:bg-[#91e17e]/20 group-data-[active=data-visualisation]/demo:outline-[#15213b]">
        <SectionLabel>Data visualisation</SectionLabel>
        <p data-hotspot-anchor="data-visualisation" className="mb-2">
          2024 General Election Results
        </p>
        <Select
          value={visualisation}
          onValueChange={(value) => {
            const match = VISUALISATIONS.find((v) => v.value === value);
            if (match) {
              onVisualisationChange(match.value);
            }
          }}
        >
          <SelectTrigger size="sm" className="h-7 w-full text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISUALISATIONS.map((v) => (
              <SelectItem key={v.value} value={v.value} className="text-xs">
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-3">
          {visualisation === "winner" ? (
            <ul className="grid gap-1">
              {LEGEND_PARTIES.map((party) => (
                <li key={party} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: getPartyColor(party) }}
                  />
                  {PARTY_NAMES[party]}
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <div
                className="h-2 rounded-sm"
                style={{
                  background: `linear-gradient(to right, ${getShareStops(visualisation).join(", ")})`,
                }}
              />
              <div className="mt-1 flex justify-between text-neutral-500">
                <span>0%</span>
                <span>
                  {Math.round(getMaxShare({ results, party: visualisation }))}%
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
