"use client";

import { MousePointerClickIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/shadcn/ui/button";
import { useQuickAddAreaList } from "../../hooks/useAreaLists";
import { getBoundaryName } from "../../v3/utils/boundaries";

/**
 * While adding to a list by clicking: which list, on what boundaries, how
 * many it has so far, and Done (or Escape) to stop
 */
export default function QuickAddBanner() {
  const { list, stop } = useQuickAddAreaList();

  useEffect(() => {
    if (!list) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [list, stop]);

  if (!list) return null;
  return (
    <div
      role="status"
      className="pointer-events-auto flex items-center gap-3 rounded-xl border border-neutral-200 bg-white py-2 pr-2 pl-3 font-sans text-sm shadow-[0_8px_30px_rgba(21,33,59,0.12)]"
    >
      <MousePointerClickIcon className="size-4 shrink-0 text-neutral-500" />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: list.color }}
          />
          <span className="truncate">Adding to {list.name}</span>
          <span className="text-xs font-normal tabular-nums text-neutral-500">
            {list.areas.length}
          </span>
        </p>
        <p className="text-[11px] text-neutral-500">
          Click areas to add or remove them ·{" "}
          {getBoundaryName(list.areaSetCode)}
        </p>
      </div>
      <Button size="sm" className="h-7" onClick={stop}>
        Done
      </Button>
    </div>
  );
}
