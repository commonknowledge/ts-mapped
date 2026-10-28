"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/shadcn/ui/button";
import { COLLECTIONS, PARTY_NAMES } from "./constants";
import MarkerSwatch from "./MarkerSwatch";
import { getPartyColor } from "./utils";
import type { AreaResult, CollectionId } from "./types";

const MAX_PARTIES = 6;

export default function LiteMapInspector({
  result,
  kind,
  markerCounts,
  isTarget,
  onToggleTarget,
  onClose,
}: {
  result: AreaResult | null;
  kind: string;
  markerCounts: { id: CollectionId; count: number }[];
  isTarget: boolean;
  onToggleTarget: () => void;
  onClose: () => void;
}) {
  const shares = result
    ? Object.entries(result.shares)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_PARTIES)
    : [];

  return (
    <div className="absolute top-2 right-2 bottom-2 flex w-[min(260px,45%)] flex-col overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg outline-2 outline-offset-2 outline-transparent transition-[outline-color] group-data-[active=inspector]/demo:outline-[#15213b]">
      {result ? (
        <>
          <div className="flex items-start gap-2 border-b border-neutral-200 p-3">
            <span
              className="mt-0.5 size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: getPartyColor(result.first) }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{result.name}</p>
              <p className="font-mono text-[9px] tracking-widest text-neutral-400 uppercase">
                {kind}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspector"
              className="cursor-pointer rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <dl className="grid grid-cols-2 gap-2">
              {result.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-neutral-500">{fact.label}</dt>
                  <dd className="font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 mb-1.5 font-mono text-[9px] tracking-widest text-neutral-400 uppercase">
              Vote share
            </p>
            <ul className="grid gap-1.5">
              {shares.map(([party, share]) => (
                <li key={party}>
                  <div className="flex justify-between">
                    <span>{PARTY_NAMES[party] ?? party}</span>
                    <span className="tabular-nums">{share}%</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${share}%`,
                        backgroundColor: getPartyColor(party),
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <ul className="mt-4 grid gap-1 rounded bg-neutral-50 p-2">
              {markerCounts.map(({ id, count }) => {
                const [one, many] = COLLECTIONS[id].countLabel;
                return (
                  <li key={id} className="flex items-center gap-1.5">
                    <MarkerSwatch id={id} />
                    {count} {count === 1 ? one : many}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-neutral-200 p-2">
            <Button
              size="sm"
              variant={isTarget ? "outline" : "default"}
              className="h-7 w-full text-[11px]"
              onClick={onToggleTarget}
            >
              {isTarget ? (
                "Remove from target areas"
              ) : (
                <>
                  <PlusIcon className="size-3" /> Add to target areas
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-neutral-500">
          Click any constituency to inspect it
        </div>
      )}
    </div>
  );
}
